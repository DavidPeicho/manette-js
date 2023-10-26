import {InputSource, TriggerState} from '../index.js';
import {Emitter} from '../utils/event.js';

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
 * There are multiple action type:
 * * {@link BooleanAction}: boolean value
 * * {@link Axis2dAction}: axis2d value (`Float32Array`)
 *
 * When an action is evaluated, it is assigned a value coming from
 * the input source.
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
     * This event might be notified every frame until the interaction is cancelled
     * or succeeded.
     *
     * Example of triggers that will emit this event: {@link LongPressTrigger}.
     */
    readonly ongoing = new Emitter<[Action]>();

    /**
     * Event triggered when the interaction is cancelled.
     *
     * Example of triggers that will emit this event: {@link LongPressTrigger}.
     */
    readonly canceled = new Emitter<[Action]>();

    /**
     * Event triggered when the interaction is completed.
     *
     * All triggers will complete upon successfull interaction.
     */
    readonly completed = new Emitter<[Action]>();

    /** The last source that activated this action. @hidden */
    readonly _source: InputSource | null = null;

    /** The state the action is currently in. @hidden */
    readonly _state = TriggerState.None;

    /** Identifier for this action. @hidden */
    private readonly _id: string;

    constructor(id: string) {
        this._id = id;
    }

    /** Reset the action state, including its value. */
    reset() {
        (this._source as InputSource | null) = null;
    }

    /** Squared magnitude of the action's value. */
    magnitudeSq() {
        return 0.0;
    }

    /** {@link TriggerState} in which the action is currently in. */
    get state() {
        return this._state;
    }

    /** The last source that activated this action. */
    get source() {
        return this._source;
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
 * Use boolean actions for on / off actions, such as jumping,
 * activating elements, etc...
 */
export class BooleanAction extends Action {
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
 */
export class Axis2dAction extends Action {
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
