import {EPSILON} from '../constants.js';

/**
 * Base class for any device, such as keyboard, mouse,
 * or gamepad.
 */
export class Device {
    /** Identifier of the device. @hidden */
    #id: string;

    constructor(id: string) {
        this.#id = id;
    }

    /**
     * Check whether buttons are simultaneously pressed.
     *
     * @note This method relies on {@link Device.pressed}.
     *
     * @param buttons Buttons id to check.
     * @returns `true` if the buttons are pressed, `false` otherwise.
     */
    groupPressed(buttons: Uint8Array): boolean {
        /* @todo: Unroll */
        for (let i = 0; i < buttons.length; ++i) {
            if (!buttons[i]) continue;
            if (!this.pressed(buttons[i])) return false;
        }
        return true;
    }

    /**
     * Gets the floating point value associated to a boolean button.
     *
     * @returns Accuation value.
     */
    value(button: number): number {
        return this.pressed(button) ? 1.0 : 0.0;
    }

    /**
     * Check whether a button is pressed or not.
     *
     * @param button Button id to check.
     * @returns `true` if the button is pressed, `false` otherwise.
     */
    pressed(button: number): boolean {
        return false;
    }

    /**
     * Read the value from a 2d axis button, such as a joypad / touchpad.
     *
     * @param out Destination array.
     * @param button Button id to read from.
     * @returns `true` if the axis is activated, i.e., non-zero.
     */
    axis2d(out: Float32Array, button: number): boolean {
        return false;
    }

    /**
     * Validate that the given button id exists in this device.
     *
     * @note This method throws if the button doesn't exist.
     *
     * @param button Button id to check.
     */
    validateButton(button: number) {}

    /**
     * Validate that the given button axis button exists in this device.
     *
     * @note This method throws if the button doesn't exist.
     *
     * @param button Button id to check.
     */
    validateAxis(button: number) {}

    /** Identifier for this device. */
    get id() {
        return this.#id;
    }
}

/**
 * Check whether an axis is zero or not.
 *
 * @param axis The axis to check.
 * @returns `true` if the axis has any non-zero component, `false` otherwise.
 */
export function isAxisNonZero(axis: ArrayLike<number>): boolean {
    return Math.abs(axis[0]) > EPSILON || Math.abs(axis[1]) > EPSILON;
}
