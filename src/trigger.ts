import {Action} from './actions/actions.js';

export enum TriggerState {
    None = 0,
    Started = 1 << 0,
    Ongoing = 1 << 1,
    Canceled = 1 << 2,
    Completed = 1 << 3,
}

export interface Trigger {
    update(action: Action, dt: number): TriggerState;
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

export class LongPressTrigger implements Trigger {
    duration: number;
    actuationSq = 0.5;

    private _timer: number | null = null;

    constructor(duration: number = 1.0) {
        this.duration = duration;
    }

    update(action: Action, dt: number) {
        const value = action.magnitudeSq();
        const accuated = value >= this.actuationSq;
        if (!accuated) {
            return this._timer !== null ? TriggerState.Canceled : TriggerState.None;
        }

        if (this._timer === null) {
            this._timer = this.duration;
            return TriggerState.Started;
        }

        this._timer -= dt;
        return this._timer > 0.0 ? TriggerState.Ongoing : TriggerState.Completed;
    }
}
