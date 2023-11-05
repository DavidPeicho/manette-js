import {Action, TriggerState} from './actions.js';
import {Device} from './devices/device.js';
import {Mapping} from './mapping.js';
import {Trigger} from './trigger.js';

/**
 * Link actions to one or multiple mappings.
 *
 * The manager {@link ActionManager.update} method is in charge of:
 * * Checking for mapping match (button down, joystick moved, etc...)
 * * Triggering action state changes
 *
 * ## Usage
 *
 * ```js
 * const fire = new BooleanAction('fire');
 *
 * const manager = new ActionManager();
 * manager.add(fire, [
 *     new BooleanMapping(mouse, MouseBinding.Primary),
 *     new BooleanMapping(keyboard, KeyboardBinding.Enter),
 * ]);
 * manager.add(move, [
 *     // WASD to [-1; 1]
 *     new EmulatedAxis2dMapping(keyboard, {
 *         maxY: KeyboardBinding.KeyW,
 *         minX: KeyboardBinding.KeyA,
 *         minY: KeyboardBinding.KeyS,
 *         maxX: KeyboardBinding.KeyD,
 *     })
 * ]);
 *
 * // Re-compute the actions value & state at every frame.
 * manager.update(dt);
 * ```
 */
export class ActionManager {
    /**
     * Validate action and mappings upon addition.
     *
     * @note Disable in production for performance reasons.
     */
    validate = true;

    /** List of managed actions. @hidden */
    readonly _actions: Action[] = [];

    /** Mappings per action. @hidden */
    readonly _mappings: Mapping[][] = [];

    /**
     * Add a new action with a list of mappings.
     *
     * @note If the action is already added, use {@link ActionManager.setMapping} instead.
     *
     * @param action The action to add.
     * @param mappings The mappings that modify the action.
     * @param trigger Automatically assigned to mapping with no trigger.
     *
     * @returns This instance, for chaining.
     */
    add(action: Action, mappings: Mapping[], trigger?: Trigger): this {
        if (this.validate && this.index(action) !== null) {
            throw new Error(`action ${action.id} already added. Update the mapping`);
        }
        const actionId = this._actions.length;
        this._actions.push(action);
        this._mappings.push([]);
        return this.setMapping(actionId, mappings, trigger);
    }

    /**
     * Update the actions state and trigger events.
     *
     * @param dt Elapsed time since the last call to `update`, **in seconds**.
     */
    update(dt: number = 0.016) {
        for (let i = 0; i < this._actions.length; ++i) {
            const mappings = this._mappings[i];
            const action = this._actions[i];
            action.reset();

            let match: Mapping | null = null;
            for (const mapping of mappings) {
                if (mapping.update(action)) {
                    match = mapping;
                    break;
                }
            }

            const newTrigger = match?.trigger ?? null;
            if (action.trigger && newTrigger !== action.trigger) {
                /* Notify the action about the previous trigger being aborted. */
                this._notify(action, action.trigger.update(action, dt));
            }

            (action._mapping as Mapping | null) = match;
            (action._trigger as Trigger | null) = newTrigger;
            (action._device as Device | null) = match?.device ?? null;
            this._notify(action, newTrigger?.update(action, dt) ?? TriggerState.None);
        }
    }

    /**
     * Override the mappings list of a given action.
     *
     * @note **Throws** if the action wasn't previously added.
     *
     * @param actionId The action, an id, or its index in the manager.
     * @param mappings The mappings.
     * @param trigger Automatically assigned to mapping with no trigger.
     *
     * @returns This instance, for chaining.
     */
    setMapping(index: number, mappings: Mapping[], trigger?: Trigger): this {
        const action = this._actions[index];
        if (!action) {
            throw new Error(`action at index '${index}' doesn't exist`);
        }

        if (this.validate) {
            for (const mapping of mappings) {
                mapping.validate(action);
            }
        }

        if (trigger) {
            for (const mapping of mappings) {
                mapping.trigger = mapping.trigger ?? trigger;
            }
        }

        this._mappings[index] = [...mappings];
        return this;
    }

    /**
     * Retrieve the mappings of the action at index `index`.
     *
     * @note **Throws** if the action wasn't previously added.
     *
     * @param index The index of the action to retrieve the mapping from.
     * @returns A list of mapping.
     */
    mapping(index: number): Mapping[] {
        const action = this._actions[index];
        if (!action) {
            throw new Error(`action at index '${index}' doesn't exist`);
        }
        return this._mappings[index];
    }

    /**
     * Retrieve the index of an action.
     *
     * @param target The action or an id.
     * @returns The action's index if found, `null` otherwise.
     */
    index(target: Action | string) {
        const id = target instanceof Action ? target.id : target;
        const index = this._actions.findIndex((action) => action.id === id);
        return index >= 0 ? index : null;
    }

    /**
     * Notify the action events and update the action's state.
     *
     * @param action The action to process.
     * @param nextState The next state to assign to the action.
     */
    private _notify(action: Action, nextState: TriggerState) {
        const previousState = action.state;
        (action._state as TriggerState) = nextState;

        switch (nextState) {
            case TriggerState.None:
                if (
                    previousState === TriggerState.Started ||
                    previousState === TriggerState.Ongoing
                ) {
                    action.canceled.notify(action);
                }
                break;
            case TriggerState.Started:
                action.started.notify(action);
                break;
            case TriggerState.Ongoing:
                if (previousState === TriggerState.None) {
                    action.started.notify(action);
                }
                action.ongoing.notify(action);
                break;
            case TriggerState.Completed:
                if (previousState === TriggerState.None) {
                    action.started.notify(action);
                }
                action.completed.notify(action);
                break;
            case TriggerState.Canceled:
                action.canceled.notify(action);
                break;
            default:
                break;
        }
    }
}
