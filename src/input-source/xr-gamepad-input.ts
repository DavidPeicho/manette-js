export enum Handedness {
    Left = 0,
    Right = 1,
}

export enum XRButtonBinding {
    Trigger = 0,
    Grip = 1,
    Joystick = 3,
    PrimaryButton = 4,
    SecondaryButton = 5,
}

/**
 * gamepad
 */
export class XRGamepadInput {
    /** @hidden */
    #xrInputSource: XRInputSource | null = null;

    private _handedness: Handedness;
    private _handednessStr: 'left' | 'right' = 'left';

    constructor(handedness: Handedness) {
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
    }

    enable(session: XRSession) {
        session.addEventListener('inputsourceschange', this.#inputSourceHandler);
    }

    get handedness(): Handedness {
        return this._handedness;
    }
}
