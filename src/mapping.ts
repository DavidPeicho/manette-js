import {Action, Axis2dAction, BooleanAction} from './actions/actions.js';
import {EPSILON} from './constants.js';
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
    buttons = new Uint8Array(4);

    constructor(source: InputSource) {
        super(source);
        this.trigger = new PressTrigger();
    }

    setButtons(...buttons: number[]): this {
        for (let i = 0; i < this.buttons.length; ++i) {
            this.buttons[i] = i < buttons.length ? buttons[i] : 0;
        }
        return this;
    }

    update(action: BooleanAction): boolean {
        action.value = this.source.groupPressed(this.buttons);
        return action.value;
    }
}

export class Axis2dMapping extends Mapping {
    button = 0;

    setButton(button: number): this {
        this.button = button;
        return this;
    }

    update(action: Axis2dAction): boolean {
        return this.source.axis2d(action.value, this.button);
    }
}

export class EmulatedAxis2dMapping extends Mapping {
    /* -x, +x, -y, +y */
    buttons = new Uint8Array(4);

    update(action: Axis2dAction): boolean {
        const x = -this.source.value(this.buttons[0]) + this.source.value(this.buttons[1]);
        const y = -this.source.value(this.buttons[2]) + this.source.value(this.buttons[3]);
        if (Math.abs(x) <= EPSILON && Math.abs(y) <= EPSILON) return false;

        action.value[0] = x;
        action.value[1] = y;
        return true;
    }

    setButtons(buttons: {minX: number; maxX: number; minY: number; maxY: number}): this {
        return this.setMinX(buttons.minX)
            .setMaxX(buttons.maxX)
            .setMinY(buttons.minY)
            .setMaxY(buttons.maxY);
    }

    setMinX(button: number): this {
        this.buttons[0] = button;
        return this;
    }

    setMaxX(button: number): this {
        this.buttons[1] = button;
        return this;
    }

    setMinY(button: number): this {
        this.buttons[2] = button;
        return this;
    }

    setMaxY(button: number): this {
        this.buttons[3] = button;
        return this;
    }
}
