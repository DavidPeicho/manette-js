export class HTMLElementMock {
    private _listeners: Map<string, ((e: Event) => void)[]> = new Map();

    addEventListener(name: string, cb: (e: Event) => void) {
        if (!this._listeners.has(name)) {
            this._listeners.set(name, []);
        }
        const array = this._listeners.get(name)!;
        array.push(cb);
    }

    dispatchEvent(e: Event) {
        const listeners = this._listeners.get(e.type) ?? [];
        for (const listener of listeners) {
            listener(e);
        }
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
