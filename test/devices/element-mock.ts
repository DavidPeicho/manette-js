import {MouseBinding, toRawButton} from '../../src/devices/mouse-device';

export class HTMLElementMock {
    private _listeners: Map<string, ((e: Event) => void)[]> = new Map();

    /** Mouse buttons. */
    private _buttons: number = 0;

    getBoundingClientRect() {
        return {width: 192, height: 100};
    }

    addEventListener(name: string, cb: (e: Event) => void) {
        if (!this._listeners.has(name)) {
            this._listeners.set(name, []);
        }
        const array = this._listeners.get(name)!;
        array.push(cb);
    }

    removeEventListener(name: string, cb: (e: Event) => void) {
        const listeners = this._listeners.get(name);
        const index = listeners?.indexOf(cb) ?? -1;
        if (index >= 0) {
            listeners!.splice(index, 1);
        }
    }

    dispatchEvent(e: Event) {
        const listeners = this._listeners.get(e.type) ?? [];
        for (const listener of listeners) {
            listener(e);
        }
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
