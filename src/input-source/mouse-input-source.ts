import {InputSource} from './input.js';

export enum MouseButtonBinding {
    None = 0,
    Primary = 1 << 0,
    Secondary = 1 << 1,
    Auxiliary = 1 << 2,
    Fourth = 1 << 3,
    Fifth = 1 << 4,
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

    pressed(buttons: number): boolean {
        return (buttons & this.buttons) === buttons;
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
    }
    private _onMouseRelease(e: PointerEvent) {
        this.buttons = e.buttons;
    }
}
