import {Action, BooleanAction} from './actions/actions.js';
import {InputSource} from './input-source/input.js';
import {PressTrigger, Trigger} from './trigger.js';

export class Mapping {
    source: InputSource;
    trigger: Trigger | null = null;

    constructor(source: InputSource) {
        this.source = source;
    }

    setTrigger(trigger: Trigger): this {
        this.trigger = trigger;
        return this;
    }

    update(action: Action): boolean {
        return false;
    }
}

export class BooleanMapping extends Mapping {
    buttons: number = 0;

    constructor(source: InputSource) {
        super(source);
        this.trigger = new PressTrigger();
    }

    setButtons(...buttons: number[]): this {
        this.buttons = 0;
        for (const button of buttons) this.buttons |= button;
        return this;
    }

    update(action: BooleanAction): boolean {
        action.value = this.source.pressed(this.buttons);
        return action.value;
    }
}
