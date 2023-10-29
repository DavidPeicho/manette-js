import {Device} from './devices/device.js';
import {Trigger} from './trigger.js';
import {Emitter} from './utils/event.js';

/**
 * Current state assigned to an action by a {@link Trigger}.
 */
export enum TriggerState {
    /** The action isn't processed, the mapping doesn't match. */
    None = 0,

    /** The action was previously {@link TriggerState.None} and just started. */
    Started = 1 << 0,

    /** The action was previously {@link TriggerState.Started}, but isn't yet done. */
    Ongoing = 1 << 1,

    /**
     * The action was {@link TriggerState.Started} or {@link TriggerState.Ongoing},
     * and was just canceled.
     */
    Canceled = 1 << 2,

    /** The action succeeded. */
    Completed = 1 << 3,
}

/**
 * Actions associate a value to a behavior in the application.
 *
 * For instance, a platformer game would have actions such as:
 * * Move
 * * Jump
 *
 * Using an action allows to decouple the raw inputs from the logic.
 *
 * ## Value
 *
 * There are multiple action types:
 * * {@link BooleanAction}: boolean value
 * * {@link Axis2dAction}: axis2d value (`Float32Array`)
 *
 * When an action is evaluated, it is assigned a value coming from
 * the device.
 *
 * ## State
 *
 * An action can be in any of the following state:
 * - `Started`: The action goes from ignored to started, but not yet complete.
 *    For example, the first press of a double press interaction.
 * - `Ongoing`: The action is started but not yet complete. During a long press interaction,
 *   the action would be in an `Ongoing` state until the time limit is reached.
 * - `Canceled`: The action was canceled while it was in a `Started` or `Ongoing` state.
 *   For instance, releasing an input during a long press.
 * - `Completed`: The action has succeeded.
 *
 * It's possible to listen to state change using the action emitters:
 *
 * ```js
 * const jumpAction = new BooleanAction();
 * jumpAction.complete.add(() => {
 *     console.log('Player jumped!');
 * });
 * ```
 *
 * For more information about state changes, have a look at the {@link Action.started},
 * {@link Action.ongoing}, {@link Action.canceled}, and {@link Action.completed} emitters.
 */
export class Action {
    /** Event triggered when the action goes from ignored to started. */
    readonly started = new Emitter<[Action]>();

    /**
     * Event triggered when the interaction is ongoing.
     *
     * This event might fire every frame until the interaction is canceled
     * or succeeded.
     *
     * Example of triggers that will emit this event: {@link ReleaseTrigger}
     * or {@link LongPressTrigger}.
     */
    readonly ongoing = new Emitter<[Action]>();

    /**
     * Event triggered when the interaction is canceled.
     *
     * Example of triggers that will emit this event: {@link ReleaseTrigger}
     * or {@link LongPressTrigger}.
     */
    readonly canceled = new Emitter<[Action]>();

    /**
     * Event triggered when the interaction is completed.
     *
     * All triggers will complete upon successful interaction.
     */
    readonly completed = new Emitter<[Action]>();

    /** Last device that activated this action. @hidden */
    readonly _device: Device | null = null;

    /** State the action is currently in. @hidden */
    readonly _state = TriggerState.None;

    /** Last trigger that modified this action's state. @hidden */
    readonly _trigger: Trigger | null = null;

    /** Identifier for this action. @hidden */
    private readonly _id: string;

    /**
     * Create a new action.
     *
     * @param id The action's identifier.
     */
    constructor(id: string) {
        this._id = id;
    }

    /** Reset the action state, including its value. */
    reset() {
        (this._device as Device | null) = null;
    }

    /** Squared magnitude of the action's value. */
    magnitudeSq() {
        return 0.0;
    }

    /** State in which the action is currently in. */
    get state() {
        return this._state;
    }

    /** Trigger that last modified this action's state. */
    get trigger() {
        return this._trigger;
    }

    /** Device that last modified this action's value. */
    get device() {
        return this._device;
    }

    /** `true` if the action is either in a `Started` or `Ongoing` state. */
    get running() {
        return this.state === TriggerState.Started || this.state === TriggerState.Ongoing;
    }

    /**
     * Identifier for this action.
     *
     * This must be unique per {@link ActionManager} instances.
     */
    get id() {
        return this._id;
    }
}

/**
 * Action storing a boolean value.
 *
 * Use boolean actions for on or off events, such as jumping,
 * activating elements, etc...
 */
export class BooleanAction extends Action {
    /** Action's value. */
    value = false;

    /**
     * Resets the value to `false`.
     *
     * @inheritdoc
     */
    reset() {
        this.value = false;
    }

    /** @inheritdoc */
    magnitudeSq() {
        return this.value ? 1.0 : 0.0;
    }
}

/**
 * Action storing an 2d axis value.
 *
 * Use axis actions for values such as move direction, etc...
 */
export class Axis2dAction extends Action {
    /** Action's value. */
    value = new Float32Array(2);

    /**
     * Resets the value to `[0, 0]`.
     *
     * @inheritdoc
     */
    reset() {
        this.value[0] = 0;
        this.value[1] = 0;
    }

    /** @inheritdoc */
    magnitudeSq() {
        return this.value[0] * this.value[0] + this.value[1] * this.value[1];
    }
}
