import {Emitter} from '../utils/event.js';
import {InputSource} from './input.js';

export enum MouseButtonBinding {
    Primary = 1,
    Secondary = 2,
    Auxiliary = 3,
    Fourth = 4,
    Fifth = 5,
}

export enum MouseValueBinding {
    None = 0,
    Position = 1 << 0,
}

export class MouseInputSource implements InputSource {
    #onMousePress = this._onMousePress.bind(this);
    #onMouseRelease = this._onMouseRelease.bind(this);
    #onMouseMove = this._onMouseMove.bind(this);

    buttons: number = 0;

    #mouseAbsolute = new Float32Array(2);
    #mouseNDC = new Float32Array(2);
    #element: HTMLElement | Window = window;

    /* Listeners */

    #onPress = new Emitter<[PointerEvent]>();
    #onRelease = new Emitter<[PointerEvent]>();

    enable(element: HTMLElement | Window) {
        this.#element = element as HTMLElement;
        this.#element.addEventListener('pointerdown', this.#onMousePress);
        this.#element.addEventListener('pointerup', this.#onMouseRelease);
        this.#element.addEventListener('pointermove', this.#onMouseMove);
        this.#element.addEventListener('contextmenu', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
    }

    disable() {
        window.removeEventListener('pointerdown', this.#onMousePress);
        window.removeEventListener('pointerup', this.#onMouseRelease);
        window.removeEventListener('pointermove', this.#onMouseMove);
    }

    pressed(buttons: Uint8Array): boolean {
        let value = 0;
        if (buttons[0] > 0) value |= buttons[0];
        if (buttons[1] > 0) value |= buttons[1];
        if (buttons[2] > 0) value |= buttons[2];
        if (buttons[3] > 0) value |= buttons[3];
        return (value & this.buttons) === value;
    }

    get mouseNDC(): Float32Array {
        return this.#mouseNDC;
    }

    private _onMouseMove(e: PointerEvent) {
        const width = document.body.clientWidth;
        const height = document.body.clientHeight;
        this.#mouseAbsolute[0] = e.clientX;
        this.#mouseAbsolute[1] = e.clientY;

        this.#mouseNDC[0] = (e.clientX / width) * 2.0 - 1.0;
        this.#mouseNDC[1] = (e.clientY / height) * 2.0 - 1.0;
    }
    private _onMousePress(e: PointerEvent) {
        this.buttons = e.buttons;
        this.#onPress.notify(e);
    }
    private _onMouseRelease(e: PointerEvent) {
        this.buttons = e.buttons;
        this.#onRelease.notify(e);
    }

    get absolute() {
        return this.#mouseAbsolute;
    }

    get onPress() {
        return this.#onPress;
    }

    get onRelease() {
        return this.#onRelease;
    }
}
