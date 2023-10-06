import {InputSource} from './input.js';

export class KeyboardInputSource implements InputSource {
    static get TypeName() {
        return 'keyboard';
    }

    /** @todo: Use an array for cache */
    state: Map<string, boolean> = new Map();

    #element: HTMLElement | Window = window;

    #onKeyPress = (e: KeyboardEvent) => {
        this.state.set(e.key, true);
    };
    #onKeyRelease = (e: KeyboardEvent) => {
        this.state.set(e.key, false);
    };

    enable(element: HTMLElement | Window) {
        this.#element = element as HTMLElement;
        this.#element.addEventListener('keydown', this.#onKeyPress);
        this.#element.addEventListener('keyup', this.#onKeyRelease);
    }

    disable() {
        const elt = this.#element as HTMLElement;
        elt.removeEventListener('keydown', this.#onKeyPress);
        elt.removeEventListener('keyup', this.#onKeyRelease);
        this.#element = window;
    }
}
