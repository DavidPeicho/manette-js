import {Action, TriggerState} from './actions.js';

/**
 * The trigger computes the {@link TriggerState} an action is in
 * based on the user's interaction.
 *
 * Triggers manipulate an action's state via a {@link Mapping}.
 *
 * ## Usage
 *
 * ```js
 * const mapping = new BooleanMapping()
 *     // Set the action's state to `Complete` after a 1 second long press.
 *     .setTrigger(new LongPressTrigger(1));
 * ```
 *
 * ## Actuation
 *
 * Most trigger are actuated via {@link Action.magnitudeSq}. Thus, it's possible
 * to use triggers with any type of actions, including {@link Axis2dAction}:
 *
 * ```js
 * const action = new Axis2dAction('move');
 * const trigger = new PressTrigger(0.75);
 *
 * // Prints 'Completed' if the action axis has a magnitude square > 0.75.
 * console.log(TriggerState[trigger.update()]);
 * ```
 */
export class Trigger {
    /**
     * Squared actuation threshold.
     *
     * This threshold is used to determine whether the action's value
     * is actuated or not.
     *
     * ```js
     * const actuation = 0.5;
     * trigger.actuationSq = actuation;
     * ```
     *
     * Alternatively, you can use {@link Trigger.setAcctuation} to set the
     * linear actuation threshold.
     */
    actuationSq = 0.5;

    /** `true` if the action is activated at this frame. @hidden */
    protected _actuated = false;

    /** `true` if the action was activated at the previous frame. @hidden */
    protected _wasActuated = false;

    /**
     * Run the trigger over a given action to compute its next state.
     *
     * @param action The action to run through the trigger.
     * @param dt Elapsed time since the last call to `update`, **in seconds**.
     * @returns The new state the action is in.
     */
    update(action: Action, dt: number): TriggerState {
        this._actuated = this.actuated(action);
        const state = this._nextState(dt, action);
        this._wasActuated = this._actuated;
        return state;
    }

    /**
     * Set the linear actuation threshold.
     *
     * This is equivalent to:
     *
     * ```js
     * const actuation = 0.5;
     * trigger.actuationSq = actuation;
     * ```
     *
     * @param actuation The linear actuation threshold.
     * @returns This instance, for chaining.
     */
    setAcctuation(actuation: number): this {
        this.actuationSq = actuation * actuation;
        return this;
    }

    actuated(action: Action): boolean {
        return action.magnitudeSq() >= this.actuationSq;
    }

    /**
     * Next state implementation.
     *
     * @param dt Elapsed time since the last call to `update`, **in seconds**.
     * @param action The action to run through the trigger.
     * @returns The new state the action is in.
     */
    protected _nextState(dt: number, action: Action): TriggerState {
        return TriggerState.None;
    }
}

/**
 * Set the action's state to {@link TriggerState.Completed} upon press.
 *
 * At the opposite of {@link PressTrigger}, this trigger will notify the
 * {@link Action.completed} at every frame, until the actuation stops.
 */
export class DownTrigger extends Trigger {
    /** @inheritdoc */
    override _nextState() {
        return this._actuated ? TriggerState.Completed : TriggerState.None;
    }
}

/**
 * Set the action's state to {@link TriggerState.Completed} after
 * an initial press.
 *
 * At the opposite of {@link DownTrigger}, this trigger will notify the
 * {@link Action.completed} event only once. The button will need to be
 */
export class PressTrigger extends Trigger {
    /** @inheritdoc */
    override _nextState() {
        return this._actuated && !this._wasActuated
            ? TriggerState.Completed
            : TriggerState.None;
    }
}

/**
 * Set the action's state to {@link TriggerState.Completed} after
 * an the binding is released.
 *
 * At the opposite of {@link ReleaseTrigger}, this trigger will notify the
 * {@link Action.completed} event only once. The button will need to be
 */
export class ReleaseTrigger extends Trigger {
    /** @inheritdoc */
    override _nextState() {
        if (this._actuated) {
            return TriggerState.Ongoing;
        }
        if (this._wasActuated) {
            return TriggerState.Completed;
        }
        return TriggerState.None;
    }
}

/**
 * Set the action's state to {@link TriggerState.Completed} if
 * the actuation is long enough.
 */
export class LongPressTrigger extends Trigger {
    /**
     * Target duration, **in seconds** before the action state
     * is {@link TriggerState.Completed}.
     */
    duration: number;

    /** Current elapsed time, **in seconds**. @hidden */
    private _timer: number = 0.0;

    private _triggered = false;

    /**
     * Create a new long press trigger.
     *
     * @param duration The hold duration, **in seconds**.
     */
    constructor(duration: number = 1.0) {
        super();
        this.duration = duration;
    }

    /** @inheritdoc */
    override _nextState(dt: number) {
        console.log(this._timer);
        if (!this._actuated) {
            this._timer = 0.0;
            return TriggerState.None;
        }
        this._timer += dt;
        if (this._timer < this.duration) {
            this._triggered = false;
            return TriggerState.Ongoing;
        }
        if (!this._triggered) {
            this._triggered = true;
            return TriggerState.Completed;
        }
        return TriggerState.None;
    }
}
