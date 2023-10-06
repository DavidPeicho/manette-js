import {Action} from './actions/actions.js';

export enum TriggerState {
    None = 0,
    Started = 1 << 0,
    Ongoing = 1 << 1,
    Canceled = 1 << 2,
    Completed = 1 << 3,
}

export interface Trigger {
    update(action: Action): TriggerState;
}

export class PressTrigger implements Trigger {
    actuationSq = 0.5;

    update(action: Action) {
        if (action.magnitudeSq() >= this.actuationSq) {
            return TriggerState.Completed;
        }
        return TriggerState.None;
    }
}
