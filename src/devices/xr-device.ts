import {Device, isAxisNonZero} from './device.js';

/** XR Handedness. */
export enum Handedness {
    Left = 0,
    Right = 1,
}

/**
 * Binding for XR buttons.
 *
 * This is a direct mapping to `buttons`:
 * https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/buttons
 */
export enum XRButtonBinding {
    Trigger = 1,
    Grip = 2,
    Joystick = 3,
    PrimaryButton = 5,
    SecondaryButton = 6,
}

/** Binding for XR axis buttons. */
export enum XRAxisBinding {
    Touchpad = 1,
    Joystick = 2,
}

/**
 * XR gamepad device.
 *
 * ## Usage
 *
 * ```js
 * const left = new XRDevice('left', Handedness.Left);
 * const right = new XRDevice('right', Handedness.Right);
 *
 * // Gamepads must be updated every frame, before running
 * // the action manager update.
 * left.update();
 * right.update();
 *
 * // Checks whether a trigger button is pressed on the left gamepad.
 * console.log(left.pressed(XRButtonBinding.Trigger));
 *
 * // Checks whether a trigger button is pressed on the right gamepad.
 * console.log(right.pressed(XRButtonBinding.Trigger));
 * ```
 */
export class XRDevice extends Device {
    /**
     * Convert a binding to a raw button value.
     *
     * For more information about button value:
     * https://developer.mozilla.org/en-US/docs/Web/API/GamepadButton
     *
     * @param binding The binding to convert.
     * @returns An index representing the button value.
     */
    static rawButton(binding: XRButtonBinding) {
        return binding - 1;
    }

    /** XR input source. @hidden */
    #xrInputSource: XRInputSource | null = null;

    /** This device handedness. @hidden */
    #handedness: Handedness;

    /** Handedness stored as a string. @hidden */
    #handednessStr: 'left' | 'right' = 'left';

    /** Bitset for pressed buttons. @hidden */
    #pressed = 0;

    /** Bitset for touched buttons. @hidden */
    #touched = 0;

    /**
     * Crete a new XR device.
     *
     * @param id Unique identifier.
     * @param handedness This device handedness.
     */
    constructor(id: string, handedness: Handedness) {
        super(id);
        this.#handedness = handedness;
        this.#handednessStr = handedness === Handedness.Left ? 'left' : 'right';
    }

    /** Triggered when the XR sources change. @hidden */
    #inputSourceHandler = (event: XRInputSourceChangeEvent) => {
        for (const item of event.removed) {
            if (item.handedness === this.#handednessStr) {
                this.#xrInputSource = null;
                break;
            }
        }
        for (const item of event.added) {
            if (item.handedness === this.#handednessStr) {
                this.#xrInputSource = item;
            }
        }
    };

    /**
     * Update the state of the input source.
     *
     * @note This method must be called before running {@link ActionManager.update}.
     */
    update(): void {
        const gamepad = this.#xrInputSource?.gamepad;
        if (!gamepad) return;

        const buttons = gamepad.buttons;

        this.#pressed = 0;
        this.#touched = 0;
        for (let i = 0; i < buttons.length; ++i) {
            const button = buttons[i];
            if (button.pressed) this.#pressed |= 1 << i;
            if (button.touched) this.#touched |= 1 << i;
        }
    }

    /** @inheritdoc */
    pressed(button: XRButtonBinding): boolean {
        const value = button - 1;
        return !!(this.#pressed & (1 << value));
    }

    /** @inheritdoc */
    axis2d(out: Float32Array, button: XRAxisBinding): boolean {
        const gamepad = this.#xrInputSource?.gamepad;
        if (!gamepad) return false;

        const i = (button - 1) * 2;
        out[0] = gamepad.axes[i];
        out[1] = gamepad.axes[i + 1];

        return isAxisNonZero(out);
    }

    /**
     * Enable this device.
     *
     * @param session The XR session.
     */
    enable(session: XRSession) {
        session.addEventListener('inputsourceschange', this.#inputSourceHandler);
        for (const source of session.inputSources) {
            if (source.handedness === this.#handednessStr) {
                this.#xrInputSource = source;
                break;
            }
        }
    }

    /** Disable this device. */
    disable() {
        this.#xrInputSource = null;
    }

    /** Get this device handedness. */
    get handedness(): Handedness {
        return this.#handedness;
    }

    /** Raw XR input source, `null` if not found or not yet enabled. */
    get xrSource(): XRInputSource | null {
        return this.#xrInputSource;
    }
}
