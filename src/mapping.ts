import {Action, Axis2dAction, BooleanAction} from './actions.js';
import {Device, isAxisNonZero} from './devices/device.js';
import {Trigger} from './trigger.js';

/**
 * A mapping updates an action's value and state based on a
 * specific binding from a {@link Device}.
 *
 * The different types of mapping are used to assign the action a value upon match:
 * * {@link BooleanMapping}: Maps a boolean button from a device
 *   to a {@link BooleanAction}
 * * {@link Axis2dMapping}: Maps an axis button from a device
 *   to an {@link Axis2dAction}
 * * {@link EmulatedAxis2dMapping}: Emulates multiple buttons from a device
 *   as an axis for the {@link Axis2dAction}
 * * etc...
 *
 * ## Usage
 *
 * ```js
 * const action = new BooleanAction();
 *
 * // Binds the 'Left' mouse button, 'Enter' keyboard key, and 'Trigger'
 * // gamepad button to the `action`.
 * manager.add(action, [
 *   new BooleanMapping(mouse, MouseBinding.Primary),
 *   new BooleanMapping(keyboard, KeyboardBinding.Enter),
 *   new BooleanMapping(gamepad, XRButtonBinding.Trigger),
 * ]);
 * ```
 *
 * ## Triggers
 *
 * Triggers are used to determine the next state the action should be in.
 *
 * Mappings have an optional trigger used to fire the {@link Action.started},
 * {@link Action.ongoing}, {@link Action.canceled}, and {@link Action.completed} events.
 *
 * ```js
 * const action = new BooleanAction();
 *
 * manager.add(action, [
 *   // Triggers when the mouse 'Left' button is pressed.
 *   new BooleanMapping(mouse, MouseBinding.Primary)
 *       .setTrigger(new PressTrigger()),
 *   // Triggers when the keyboard 'Enter' button is pressed for 1 second.
 *   new BooleanMapping(keyboard, KeyboardBinding.Enter)
 *        .setTrigger(new LongPressTrigger(1)),
 * ]);
 * ```
 *
 * For more information about triggers, have a look at the {@link Trigger} documentation.
 */
export class Mapping {
    /** {@link Device} to read from. */
    device: Device;

    /** Optional trigger modifyinf the action's state. */
    trigger: Trigger | null = null;

    /**
     * Create a new mapping.
     *
     * @param device The device checked by this mapping.
     */
    constructor(device: Device) {
        this.device = device;
    }

    /**
     * Attach a trigger to this mapping.
     *
     * @param trigger The trigger to set.
     * @returns This instance, for chaining.
     */
    setTrigger(trigger: Trigger): this {
        this.trigger = trigger;
        return this;
    }

    /**
     * Update the action's value.
     *
     * @param action The action to process.
     * @returns `true` if the binding matched, `false` otherwise.
     */
    update(action: Action): boolean {
        return false;
    }

    /**
     * Validate an action against this mapping.
     *
     * @note This method **throws** if the action isn't compatible with
     * this mapping.
     *
     * @param action The action to check.
     */
    validate(action: Action): void {}

    /**
     * Validate buttons, i.e., ensure they belong to the device.
     *
     * @note This method **throws** if any button isn't compatible with the device.
     *
     * @param name Name to display upon error.
     * @param buttons Buttons to validate.
     *
     * @hidden
     */
    protected _validateSourceButtons(name: string, ...buttons: number[]) {
        let anyValid = false;
        for (const button of buttons) {
            if (!button) continue;
            this.device.validateButton(button);
            anyValid = true;
        }
        if (!anyValid) {
            throw new Error(`${name} has no buttons set`);
        }
    }
}

/**
 * Activate the action if **all** specified buttons match.
 *
 * @note This mapping can't be used with axis buttons.
 */
export class BooleanMapping extends Mapping {
    /**
     * List of buttons that must be simultaneously pressed
     * for the mapping to match.
     *
     * A value of `0` means that the button is skipped.
     *
     * ```js
     * // This mapping only requires the 'Space' bar button to be pressed.
     * const mapping = new BooleanMapping();
     * mapping.buttons[0] = KeyboardBinding.Space;
     * mapping.buttons[1] = 0; // Disabled
     * mapping.buttons[2] = 0; // Disabled
     * mapping.buttons[3] = 0; // Disabled
     * ```
     *
     * @note Each button id must be in the [0; 255] range. Devices
     * with more than **256** buttons aren't supported.
     */
    buttons = new Uint8Array(4);

    /**
     * Create a new boolean mapping.
     *
     * @param device The device checked by this mapping.
     * @param buttons The list of button bindings. This can be later specified
     *     using {@link BooleanMapping.buttons} or {@link BooleanMapping.setButtons}.
     */
    constructor(device: Device, ...buttons: number[]) {
        super(device);
        this.setButtons(...buttons);
    }

    /**
     * Set the list of buttons that must be pressed for this mapping
     * to activate the action.
     *
     * @param buttons The list of required buttons.
     * @returns This instance, for chaining.
     */
    setButtons(...buttons: number[]): this {
        for (let i = 0; i < this.buttons.length; ++i) {
            this.buttons[i] = i < buttons.length ? buttons[i] : 0;
        }
        return this;
    }

    /** @inheritdoc */
    update(action: BooleanAction): boolean {
        action.value = this.device.groupPressed(this.buttons);
        return action.value;
    }

    /** @inheritdoc */
    validate(action: Action): void {
        const value = (action as BooleanAction).value;
        const type = typeof value;
        if (type !== 'boolean' && type !== 'number') {
            throw new Error(
                'BooleanMapping can only be used with boolean / numeric actions.\n' +
                    `\tAction '${action.id}' has a non-compatible value of type ${type}.`
            );
        }
        this._validateSourceButtons('BooleanMapping', ...this.buttons);
    }
}

/**
 * Activate the action when the specified axis button is used.
 *
 * @note This mapping can't be used with boolean buttons.
 */
export class Axis2dMapping extends Mapping {
    /**
     * The axis button button.
     *
     * A value of `0` means that the button is skipped.
     *
     * ```js
     * // This mapping only requires the 'Space' bar button to be pressed.
     * const mapping = new Axis2dMapping();
     * mapping.button = XRAxisBinding.Joystick;
     * ```
     */
    button = 0;

    /**
     * Create a new boolean mapping.
     *
     * @param device The device checked by this mapping.
     * @param button The axis button binding. This can be later specified
     *     using {@link BooleanMapping.button} or {@link BooleanMapping.setButton}.
     */
    constructor(device: Device, button: number = 0) {
        super(device);
        this.button = button;
    }

    /**
     * Set the axis button binding.
     *
     * Each device has its own enumeration for axis binding. For instance,
     * the {@link XRDevice} exposes {@link XRAxisBinding}.
     *
     * @param button The axis button binding.
     * @returns This instance, for chaining.
     */
    setButton(button: number): this {
        this.button = button;
        return this;
    }

    /** @inheritdoc */
    update(action: Axis2dAction): boolean {
        return this.device.axis2d(action.value, this.button);
    }

    /** @inheritdoc */
    validate(action: Action): void {
        const value = (action as Axis2dAction).value;
        if (!value.length) {
            throw new Error(
                'Axis2dMapping can only be used with axis2d actions.\n' +
                    `\tAction '${action.id}' has a non-array value.`
            );
        }
        this.device.validateAxis(this.button);
    }
}

/**
 * Options for {@link EmulatedAxis2dMapping} and {@link EmulatedAxis2dMapping.setButtons}.
 */
export interface EmulatedAxis2dOptions {
    /** Button binding for `x = -1` */
    minX: number;
    /** Button binding for `x = +1` */
    maxX: number;
    /** Button binding for `y = -1` */
    minY: number;
    /** Button binding for `y = +1` */
    maxY: number;
}

/**
 * Convert four boolean buttons to a 2 axis value in the range `[-1; 1]`.
 *
 * ## Usage
 *
 * ```js
 * // Binds buttons 'W', 'A', 'S', and 'D' to a value in the range [-1; 1].
 * const mapping = new EmulatedAxis2dMapping(keyboard, {
 *     minX: KeyboardBinding.KeyA, // Negative x binding
 *     maxX: KeyboardBinding.KeyD, // Positive x binding
 *     minY: KeyboardBinding.KeyS, // Negative y binding
 *     maxY: KeyboardBinding.KeyW, // Positive y binding
 * });
 * ```
 *
 * @note This mapping can only be used with boolean binding.
 */
export class EmulatedAxis2dMapping extends Mapping {
    /**
     * List of buttons mapping to the axis.
     *
     * The array expects the binding in the order: `-x`, `+x`, `-y`, `+y`.
     *
     * ```js
     * // This mapping only requires the 'Space' bar button to be pressed.
     * const mapping = new EmulatedAxis2dMapping();
     * mapping.buttons[0] = KeyboardBinding.A;
     * mapping.buttons[1] = KeyboardBinding.D;
     * mapping.buttons[2] = KeyboardBinding.S;
     * mapping.buttons[3] = KeyboardBinding.W;
     * ```
     *
     * @note Each button id must be in the [0; 255] range. Devices
     * with more than **256** buttons aren't supported.
     */
    buttons = new Uint8Array(4);

    /**
     * Create a new emulated axis mapping.
     *
     * @param device The device checked by this mapping.
     * @param buttons The list of button bindings. This can be later specified
     *     using {@link EmulatedAxis2dMapping.buttons}
     *     or {@link EmulatedAxis2dMapping.setButtons}.
     */
    constructor(device: Device, options?: EmulatedAxis2dOptions) {
        super(device);
        if (options) this.setButtons(options);
    }

    /** @inheritdoc */
    update(action: Axis2dAction): boolean {
        action.value[0] =
            -this.device.value(this.buttons[0]) + this.device.value(this.buttons[1]);
        action.value[1] =
            -this.device.value(this.buttons[2]) + this.device.value(this.buttons[3]);
        return isAxisNonZero(action.value);
    }

    /**
     * Set the list of buttons that must be pressed for this mapping
     * to activate the action.
     *
     * @param buttons The list of required buttons.
     * @returns This instance, for chaining.
     */
    setButtons(buttons: EmulatedAxis2dOptions): this {
        this.buttons[0] = buttons.minX;
        this.buttons[1] = buttons.maxX;
        this.buttons[2] = buttons.minY;
        this.buttons[3] = buttons.maxY;
        return this;
    }

    /** @inheritdoc */
    validate(action: Action): void {
        const value = (action as Axis2dAction).value;
        const type = typeof value;
        if (type !== 'object') {
            throw new Error(
                `Action '${action.id}' has a non-array value, found type '${type}'.\n` +
                    '\tEmulatedAxis2dMapping can only be used with axis2d actions.'
            );
        }
        this._validateSourceButtons('EmulatedAxis2dMapping', ...this.buttons);
    }
}
