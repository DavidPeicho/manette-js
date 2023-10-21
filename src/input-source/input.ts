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

export function testButtons(buttons: Uint8Array, bitset: number): boolean {
    let value = 0;
    if (buttons[0] > 0) value |= buttons[0];
    if (buttons[1] > 0) value |= buttons[1];
    if (buttons[2] > 0) value |= buttons[2];
    if (buttons[3] > 0) value |= buttons[3];
    return (value & bitset) === value;
}
