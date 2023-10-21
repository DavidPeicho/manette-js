export class InputSource {
    #id: string;

    constructor(id: string) {
        this.#id = id;
    }

    pressed(buttons: Uint8Array): boolean {
        return false;
    }

    get id() {
        return this.#id;
    }
}
