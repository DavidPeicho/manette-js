import {Action} from './actions.js';
import {InputSource} from './input-source/input.js';
import {Mapping} from './mapping.js';
import {Trigger, TriggerState} from './trigger.js';

/**
 * Links {@link Action}, {@link Mapping}, and {@link Trigger} together.
 */
export class ActionManager {
    validate = true;

    readonly _sources: InputSource[];
    readonly _actions: Action[] = [];
    readonly _triggers: (Trigger | null)[] = [];
    readonly _mappings: Mapping[][] = [];

    constructor(sources: InputSource[]) {
        this._sources = new Array(sources.length).fill(null);
        for (let i = 0; i < sources.length; ++i) {
            this._sources[i] = sources[i];
        }
    }

    add(action: Action, mappings: Mapping[]): this {
        if (this.validate && this.actionId(action) !== null) {
            throw new Error(`action ${action.id} already added. Update the mapping`);
        }
        const actionId = this._actions.length;
        this._actions.push(action);
        this._mappings.push([]);
        return this.setMapping(actionId, mappings);
    }

    setMapping(actionId: number, mappings: Mapping[]): this {
        const action = this._actions[actionId];
        if (this.validate) {
            if (!action) {
                throw new Error(`action with id '${actionId}' doesn't exist`);
            }
            for (const mapping of mappings) {
                mapping.validate(action);
            }
        }
        this._mappings[actionId] = [...mappings];
        return this;
    }

    mapping(actionId: number): Mapping[] {
        return this._mappings[actionId];
    }

    update(dt: number) {
        for (let i = 0; i < this._actions.length; ++i) {
            const trigger = this._triggers[i];
            const mappings = this._mappings[i];
            const action = this._actions[i];
            action.reset();

            let match: Mapping | null = null;
            for (const mapping of mappings) {
                if (mapping.update(action)) {
                    match = mapping;
                    break;
                }
            }

            if (!match || match.trigger !== trigger) {
                if (action.running) {
                    (action._state as TriggerState) = TriggerState.Canceled;
                    action.canceled.notify(action);
                } else {
                    (action._state as TriggerState) = TriggerState.None;
                }
                trigger?.reset();
            }
            if (!match) continue;

            (action._source as InputSource) = match.source;
            if (match.trigger) {
                (action._state as TriggerState) = match.trigger.update(action, dt);
                this._triggers[i] = match.trigger;
            }
            switch (action.state) {
                case TriggerState.Started:
                    action.started.notify(action);
                    break;
                case TriggerState.Ongoing:
                    action.ongoing.notify(action);
                    break;
                case TriggerState.Canceled:
                    action.canceled.notify(action);
                    break;
                case TriggerState.Completed:
                    action.completed.notify(action);
                    break;
                default:
                    break;
            }
        }
    }

    actionId(target: Action) {
        const index = this._actions.findIndex((action) => action.id === target.id);
        return index >= 0 ? index : null;
    }
}
