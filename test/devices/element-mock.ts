import {EventMock} from './event-mock.js';

export class HTMLElementMock extends EventMock {
    /** Mouse buttons. */
    private _buttons: number = 0;

    getBoundingClientRect() {
        return {width: 192, height: 100};
    }

    pointerdown(...inputs: number[]) {
        for (const i of inputs) {
            this._buttons |= i;
        }
        this.dispatchEvent({type: 'pointerdown', buttons: this._buttons} as PointerEvent);
    }

    pointerup(...inputs: number[]) {
        for (const i of inputs) {
            this._buttons &= ~i;
        }
        this.dispatchEvent({type: 'pointerup', buttons: this._buttons} as PointerEvent);
    }

    keydown(...codes: string[]) {
        for (const code of codes) {
            this.dispatchEvent({type: 'keydown', code} as KeyboardEvent);
        }
    }

    keyup(...codes: string[]) {
        for (const code of codes) {
            this.dispatchEvent({type: 'keyup', code} as KeyboardEvent);
        }
    }
}
