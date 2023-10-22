import {InputSource} from '../input-source/input.js';
import {Mapping} from '../mapping.js';
import {TriggerState} from '../trigger.js';
import {Action} from './actions.js';

export class ActionManager {
    validate = true;

    readonly _sources: InputSource[];
    readonly _actions: Action[] = [];
    readonly _mappings: Mapping[][] = [];

    constructor(sources: InputSource[]) {
        this._sources = new Array(sources.length).fill(null);
        for (let i = 0; i < sources.length; ++i) {
            this._sources[i] = sources[i];
        }
    }

    add(action: Action, mappings: Mapping[]): this {
        if (this.validate) {
            if (this.actionId(action) === null) {
                throw new Error(`action ${action.name} already added. Update the mapping`);
            }
            for (const mapping of mappings) {
                mapping.validate(action);
            }
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
            const action = this._actions[i];
            const mappings = this._mappings[i];
            action.reset();
            for (const mapping of mappings) {
                const match = mapping.update(action);
                action.source = match ? mapping.source : null;
                action.state = mapping.trigger?.update(action) ?? TriggerState.None;
                switch (action.state) {
                    case TriggerState.Completed:
                        action.completed.notify(action);
                        break;
                    default:
                        break;
                }
                if (match) break;
            }
        }
    }

    actionId(target: Action) {
        const index = this._actions.findIndex((action) => action.name === target.name);
        return index >= 0 ? index : null;
    }
}
