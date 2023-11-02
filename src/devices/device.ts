import {EPSILON} from '../constants.js';

/**
 * Base class for any device, such as a keyboard, mouse,
 * or gamepad.
 */
export class Device<ButtonBinding = number, AxisBinding = number> {
    /** Identifier of the device. @hidden */
    #id: string;

    /**
     * @param id Unique identifier.
     */
    constructor(id: string) {
        this.#id = id;
    }

    /**
     * Check whether buttons are simultaneously pressed.
     *
     * @note This method relies on {@link Device.pressed}.
     *
     * @param buttons Buttons IDs to check.
     * @returns `true` if the buttons are pressed, `false` otherwise.
     */
    groupPressed(buttons: Uint8Array): boolean {
        /* @todo: Unroll */
        for (let i = 0; i < buttons.length; ++i) {
            if (!buttons[i]) continue;
            if (!this.pressed(buttons[i] as ButtonBinding)) return false;
        }
        return true;
    }

    /**
     * Get the floating point value associated to a boolean button.
     *
     * @returns Actuation value.
     */
    value(button: ButtonBinding): number {
        return this.pressed(button) ? 1.0 : 0.0;
    }

    /**
     * Check whether a button is pressed or not.
     *
     * @param button Button ID to check.
     * @returns `true` if the button is pressed, `false` otherwise.
     */
    pressed(button: ButtonBinding): boolean {
        return false;
    }

    /**
     * Read the value from a 2d axis button, such as a joypad / touchpad.
     *
     * @param out Destination array.
     * @param button Button ID to read from.
     * @returns `true` if the axis is activated, i.e., non-zero.
     */
    axis2d(out: Float32Array, button: AxisBinding): boolean {
        return false;
    }

    /**
     * Validate that the given button ID exists on this device.
     *
     * @note This method throws if the button doesn't exist.
     *
     * @param button Button ID to check.
     */
    validateButton(button: number) {}

    /**
     * Validate that the given button axis button exists on this device.
     *
     * @note This method throws if the button doesn't exist.
     *
     * @param button Button ID to check.
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
