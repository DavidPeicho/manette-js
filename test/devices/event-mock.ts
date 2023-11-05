export class EventMock {
    protected _listeners: Map<string, ((e: Event) => void)[]> = new Map();

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
}
