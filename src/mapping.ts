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

    validate(action: Action): void {}

    protected _validateSourceButtons(...buttons: number[]) {
        for (const button of buttons) {
            if (!button) continue;
            this.source.validateButton(button);
        }
    }
}

export class BooleanMapping extends Mapping {
    buttons = new Uint8Array(4);

    constructor(source: InputSource, ...buttons: number[]) {
        super(source);
        this.setButtons(...buttons);
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

    validate(action: Action): void {
        const value = (action as BooleanAction).value;
        const type = typeof value;
        if (type !== 'boolean' && type !== 'number') {
            throw new Error(
                'BooleanMapping can only be used with boolean / numeric actions.\n' +
                    `\tAction '${action.name}' has a non-compatible value of type ${type}.`
            );
        }
        this._validateSourceButtons(...this.buttons);
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

    validate(action: Action): void {
        const value = (action as Axis2dAction).value;
        if (!Array.isArray(value)) {
            throw new Error(
                'Axis2dMapping can only be used with axis2d actions.\n' +
                    `\tAction '${action.name}' has a non-array value.`
            );
        }
        this.source.validateAxis(this.button);
    }
}

export interface EmulatedAxis2dOptions {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export class EmulatedAxis2dMapping extends Mapping {
    /* -x, +x, -y, +y */
    buttons = new Uint8Array(4);

    constructor(source: InputSource, options?: EmulatedAxis2dOptions) {
        super(source);
        if (options) this.setButtons(options);
    }

    update(action: Axis2dAction): boolean {
        const x = -this.source.value(this.buttons[0]) + this.source.value(this.buttons[1]);
        const y = -this.source.value(this.buttons[2]) + this.source.value(this.buttons[3]);
        if (Math.abs(x) <= EPSILON && Math.abs(y) <= EPSILON) return false;

        action.value[0] = x;
        action.value[1] = y;
        return true;
    }

    setButtons(buttons: EmulatedAxis2dOptions): this {
        this.buttons[0] = buttons.minX;
        this.buttons[1] = buttons.maxX;
        this.buttons[2] = buttons.minY;
        this.buttons[3] = buttons.maxY;
        return this;
    }

    validate(action: Action): void {
        const value = (action as Axis2dAction).value;
        const type = typeof value;
        if (type !== 'object') {
            throw new Error(
                `Action '${action.name}' has a non-array value, found type '${type}'.\n` +
                    '\tEmulatedAxis2dMapping can only be used with axis2d actions.'
            );
        }
        this._validateSourceButtons(...this.buttons);
    }
}
