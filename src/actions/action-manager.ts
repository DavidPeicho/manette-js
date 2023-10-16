import {InputSource} from '../input-source/input.js';
import {Mapping} from '../mapping.js';
import {TriggerState} from '../trigger.js';
import {Action} from './actions.js';

export class ActionManager {
    _sourceToIndex: Map<InputSource, number> = new Map();
    _sources: InputSource[];

    _actions: Action[] = [];
    _mappings: Mapping[][] = [];

    constructor(sources: InputSource[]) {
        this._sources = new Array(sources.length).fill(null);
        for (let i = 0; i < sources.length; ++i) {
            this._sources[i] = sources[i];
            this._sourceToIndex.set(sources[i], i);
        }
    }

    add(action: Action, mappings: Mapping[] = []): this {
        this._actions.push(action);
        this._mappings.push([...mappings]);
        return this;
    }

    update(dt: number) {
        for (let i = 0; i < this._actions.length; ++i) {
            const action = this._actions[i];
            const mappings = this._mappings[i];
            action.reset();
            for (const mapping of mappings) {
                const match = mapping.update(action);
                const state = mapping.trigger?.update(action);
                switch (state) {
                    case TriggerState.Completed:
                        action.completed.notify(action);
                        break;
                }
                if (!match) break;
            }
        }
    }

    actionId(target: Action) {
        const index = this._actions.findIndex((action) => action.name === target.name);
        return index >= 0 ? index : null;
    }
}
