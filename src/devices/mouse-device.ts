import {Emitter} from '../utils/event.js';
import {Device, isAxisNonZero} from './device.js';

/** Binding for mouse buttons. */
export enum MouseBinding {
    /** Left mouse button. */
    Primary = 1,
    /** Right mouse button. */
    Secondary = 2,
    /** Mouse wheel button. */
    Auxiliary = 3,
    Fourth = 4,
    Fifth = 5,
}

/** Binding for mouse axis buttons. */
export enum MouseAxisBinding {
    NormalizedPosition = 1,
}

/**
 * Mouse device.
 *
 * ## Usage
 *
 * ```js
 * const mouse = new MouseDevice('mouse');
 * enable(document.body); // Registers listeners.
 *
 * // Checks whether the left button is pressed or not.
 * console.log(mouse.pressed(MouseBinding.Primary));
 * ```
 */
export class MouseDevice extends Device<MouseBinding, MouseAxisBinding> {
    /**
     * Convert a binding to a raw button value.
     *
     * For more information about button value:
     * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
     *
     * @param binding The binding to convert.
     * @returns A power of two representing the button value.
     */
    static rawButton(binding: MouseBinding) {
        return 1 << (binding - 1);
    }

    /** Bitset for pressed buttons. @hidden */
    #buttons: number = 0;

    /** Absolute mouse position. */
    #mouseAbsolute = new Float32Array(2);

    /** Mouse coordinates in [-1; 1] range. @hidden */
    #mouseNDC = new Float32Array(2);

    /** HTML element for pointer event listeners. @hidden */
    #element: HTMLElement | null = null;

    /** Triggered on mouse press. @hidden */
    #onMousePress = this._onMousePress.bind(this);
    /** Triggered on mouse release. @hidden */
    #onMouseRelease = this._onMouseRelease.bind(this);
    /** Triggered on mouse move. @hidden */
    #onMouseMove = this._onMouseMove.bind(this);

    /* Listeners */

    /** Emitter for press event. @hidden */
    #onPress = new Emitter<[PointerEvent]>();
    /** Emitter for release event. @hidden */
    #onRelease = new Emitter<[PointerEvent]>();

    /**
     * Register mouse listeners on the given HTML element.
     *
     * @param element The element to register on.
     */
    enable(element?: HTMLElement | Document) {
        this.#element = (element ?? document.body) as HTMLElement;
        this.#element.addEventListener('pointerdown', this.#onMousePress);
        this.#element.addEventListener('pointerup', this.#onMouseRelease);
        this.#element.addEventListener('pointermove', this.#onMouseMove);
        this.#element.addEventListener('contextmenu', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        return this;
    }

    /** Disable the mouse listeners. */
    disable() {
        const elt = this.#element as HTMLElement;
        if (!elt) return;
        elt.removeEventListener('pointerdown', this.#onMousePress);
        elt.removeEventListener('pointerup', this.#onMouseRelease);
        elt.removeEventListener('pointermove', this.#onMouseMove);
    }

    /** @inheritdoc */
    pressed(button: MouseBinding): boolean {
        return !!(this.#buttons & MouseDevice.rawButton(button));
    }

    /** @inheritdoc */
    axis2d(out: Float32Array, button: MouseAxisBinding): boolean {
        switch (button) {
            case MouseAxisBinding.NormalizedPosition:
                out[0] = this.#mouseNDC[0];
                out[1] = this.#mouseNDC[1];
                break;
        }
        return isAxisNonZero(out);
    }

    /** @inheritdoc */
    validateButton(button: MouseBinding) {
        if (MouseBinding[button] === undefined) {
            throw new Error(
                `Device '${this.id}' used with an invalid button.\n` +
                    `\tButton '${button}' doesn't exist on MouseBinding'`
            );
        }
    }

    /** HTML element processing the mouse events. */
    get element() {
        return this.#element;
    }

    /** Mouse coordinates, in the range [-1; 1]. */
    get mouseNDC(): Float32Array {
        return this.#mouseNDC;
    }

    /** Mouse coordinates, relative to `document.body`. */
    get absolute() {
        return this.#mouseAbsolute;
    }

    /**
     * Emitter for raw mouse press events.
     *
     * ## Usage
     *
     * ```js
     * const mouse = new MouseDevice();
     * mouse.onPress.add((e) => {
     *     console.log('Raw press event: ', e);
     * });
     * ```
     */
    get onPress() {
        return this.#onPress;
    }

    /**
     * Emitter for raw mouse release events.
     *
     * ## Usage
     *
     * ```js
     * const mouse = new MouseDevice();
     * mouse.onRelease.add((e) => {
     *     console.log('Raw release event: ', e);
     * });
     * ```
     */
    get onRelease() {
        return this.#onRelease;
    }

    /** Process mouse move events. @hidden */
    private _onMouseMove(e: PointerEvent) {
        const elt = this.#element as HTMLElement;
        const rect = elt.getBoundingClientRect();

        this.#mouseAbsolute[0] = e.clientX;
        this.#mouseAbsolute[1] = e.clientY;

        this.#mouseNDC[0] = (e.clientX / rect.width) * 2.0 - 1.0;
        this.#mouseNDC[1] = (e.clientY / rect.height) * 2.0 - 1.0;
    }

    /** Process mouse press events. @hidden */
    private _onMousePress(e: PointerEvent) {
        this.#buttons = e.buttons;
        this.#onPress.notify(e);
    }

    /** Process mouse release events. @hidden */
    private _onMouseRelease(e: PointerEvent) {
        this.#buttons = e.buttons;
        this.#onRelease.notify(e);
    }
}
