import {InputSource, isAxisNonZero} from './input.js';

/** XR Handedness. */
export enum Handedness {
    Left = 0,
    Right = 1,
}

/** Binding for XR buttons. */
export enum XRButtonBinding {
    Trigger = 1,
    Grip = 2,
    Joystick = 3,
    PrimaryButton = 4,
    SecondaryButton = 5,
}

/** Binding for XR axis buttons. */
export enum XRAxisBinding {
    Touchpad = 0,
    Joystick = 1,
}

/**
 * XR gamepad input source.
 *
 * ## Usage
 *
 * ```js
 * const left = new XRGamepadInput('left', Handedness.Left);
 * const right = new XRGamepadInput('right', Handedness.Right);
 *
 * // Gamepads must be updated every frame, before running
 * // the action manager update.
 * left.update();
 * right.update();
 *
 * // Checks whether the trigger button is pressed on the left gamepad.
 * console.log(left.pressed(XRButtonBinding.Trigger));
 *
 * // Checks whether the trigger button is pressed on the right gamepad.
 * console.log(right.pressed(XRButtonBinding.Trigger));
 * ```
 */
export class XRGamepadInput extends InputSource {
    /** XR input source. @hidden */
    #xrInputSource: XRInputSource | null = null;

    /** This source handedness. @hidden */
    #handedness: Handedness;

    /** Handedness stored as a string. @hidden */
    #handednessStr: 'left' | 'right' = 'left';

    /** Bitset for pressed buttons. @hidden */
    #pressed = 0;

    /** Bitset for touched buttons. @hidden */
    #touched = 0;

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
            this.#pressed &= button.pressed ? 1 << i : ~0;
            this.#touched &= button.touched ? 1 << i : ~0;
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

        const i = button * 2;
        out[0] = gamepad.axes[i];
        out[1] = gamepad.axes[i + 1];

        return isAxisNonZero(out);
    }

    /**
     * Enable this input source.
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

    /** Disable this input source. */
    disable() {
        this.#xrInputSource = null;
    }

    /** Get this source handedness. */
    get handedness(): Handedness {
        return this.#handedness;
    }

    /** Raw XR input source, `null` if not found or not yet enabled. */
    get xrSource(): XRInputSource | null {
        return this.#xrInputSource;
    }
}
