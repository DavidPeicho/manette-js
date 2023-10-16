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

    private _wasPressed = false;

    update(action: Action) {
        const value = action.magnitudeSq();
        const accuated = value >= this.actuationSq;
        if (accuated && !this._wasPressed) {
            this._wasPressed = true;
            return TriggerState.Completed;
        }
        this._wasPressed = accuated;
        return TriggerState.None;
    }
}

export class DownTrigger implements Trigger {
    actuationSq = 0.5;

    update(action: Action) {
        const value = action.magnitudeSq();
        return value >= this.actuationSq ? TriggerState.Completed : TriggerState.None;
    }
}
