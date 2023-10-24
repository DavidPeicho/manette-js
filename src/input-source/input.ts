import {EPSILON} from '../constants.js';

export class InputSource {
    #id: string;

    constructor(id: string) {
        this.#id = id;
    }

    groupPressed(buttons: Uint8Array): boolean {
        /* @todo: Unroll */
        for (let i = 0; i < buttons.length; ++i) {
            if (!buttons[i]) continue;
            if (!this.pressed(buttons[i])) return false;
        }
        return true;
    }

    value(button: number): number {
        return this.pressed(button) ? 1.0 : 0.0;
    }

    pressed(button: number): boolean {
        return false;
    }

    axis2d(out: Float32Array, button: number): boolean {
        return false;
    }

    validateButton(button: number) {}
    validateAxis(button: number) {}

    get id() {
        return this.#id;
    }
}

export function testButtons(buttons: Uint8Array, bitset: number): boolean {
    let value = 0;
    if (buttons[0] > 0) value |= buttons[0];
    if (buttons[1] > 0) value |= buttons[1];
    if (buttons[2] > 0) value |= buttons[2];
    if (buttons[3] > 0) value |= buttons[3];
    return (value & bitset) === value;
}

export function isAxisNonZero(axis: ArrayLike<number>): boolean {
    return Math.abs(axis[0]) > EPSILON || Math.abs(axis[1]) > EPSILON;
}
