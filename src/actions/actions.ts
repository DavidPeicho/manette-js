import {InputSource, TriggerState} from '../index.js';
import {Emitter} from '../utils/event.js';

export class Action {
    private readonly _name: string;

    started = new Emitter<[Action]>();
    ongoing = new Emitter<[Action]>();
    completed = new Emitter<[Action]>();
    canceled = new Emitter<[Action]>();

    source: InputSource | null = null;
    state = TriggerState.None;

    constructor(name: string) {
        this._name = name;
    }

    reset() {
        this.source = null;
    }

    magnitudeSq() {
        return 0.0;
    }

    get running() {
        return this.state === TriggerState.Started || this.state === TriggerState.Ongoing;
    }

    get name() {
        return this._name;
    }
}

/* Can have a state */
export class BooleanAction extends Action {
    value = false;

    reset() {
        this.value = false;
    }

    magnitudeSq() {
        return this.value ? 1.0 : 0.0;
    }
}

/* Doesn't have a state */
export class Axis2dAction extends Action {
    value = new Float32Array(2);

    reset() {
        this.value[0] = 0;
        this.value[1] = 0;
    }

    magnitudeSq() {
        return this.value[0] * this.value[0] + this.value[1] * this.value[1];
    }
}
