import {InputSource, isAxisNonZero} from './input.js';

export enum Handedness {
    Left = 0,
    Right = 1,
}

export enum XRButtonBinding {
    Trigger = 1,
    Grip = 2,
    Joystick = 3,
    PrimaryButton = 4,
    SecondaryButton = 5,
}

export enum XRAxisBinding {
    Touchpad = 0,
    Joystick = 1,
}

/**
 * gamepad
 */
export class XRGamepadInput extends InputSource {
    /** @hidden */
    #xrInputSource: XRInputSource | null = null;

    private _handedness: Handedness;
    private _handednessStr: 'left' | 'right' = 'left';

    #pressed = 0;
    #touched = 0;

    constructor(id: string, handedness: Handedness) {
        super(id);
        this._handedness = handedness;
        this._handednessStr = handedness === Handedness.Left ? 'left' : 'right';
    }

    #inputSourceHandler = (event: XRInputSourceChangeEvent) => {
        for (const item of event.removed) {
            if (item.handedness === this._handednessStr) {
                this.#xrInputSource = null;
                break;
            }
        }
        for (const item of event.added) {
            if (item.handedness === this._handednessStr) {
                this.#xrInputSource = item;
            }
        }
    };

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

    pressed(button: XRButtonBinding): boolean {
        const value = button - 1;
        return !!(this.#pressed & (1 << value));
    }

    axis2d(out: Float32Array, button: XRAxisBinding): boolean {
        const gamepad = this.#xrInputSource?.gamepad;
        if (!gamepad) return false;

        const i = button * 2;
        out[0] = gamepad.axes[i];
        out[1] = gamepad.axes[i + 1];

        return isAxisNonZero(out);
    }

    enable(session: XRSession) {
        session.addEventListener('inputsourceschange', this.#inputSourceHandler);
    }

    get handedness(): Handedness {
        return this._handedness;
    }

    get xrSource(): XRInputSource | null {
        return this.#xrInputSource;
    }
}
