import assert from 'node:assert';
import test, {describe} from 'node:test';

import {Action, Axis2dAction, BooleanAction, TriggerState} from '../src/actions.js';
import {DownTrigger} from '../src/trigger.js';

function enable(action: Action) {
    if (action instanceof BooleanAction) {
        action.value = true;
        return;
    }
    const value = (action as Axis2dAction).value;
    value[0] = 1;
    value[1] = 1;
}

function disable(action: Action) {
    if (action instanceof BooleanAction) {
        action.value = false;
        return;
    }
    const value = (action as Axis2dAction).value;
    value[0] = 0;
    value[1] = 0;
}

describe('DownTrigger', (_) => {
    for (const ActionCtor of [BooleanAction, Axis2dAction]) {
        test(`.update() with ${ActionCtor.name}`, (_) => {
            const bool = new ActionCtor('down');
            const trigger = new DownTrigger();

            assert.equal(trigger.update(bool), TriggerState.None);

            enable(bool);
            for (let i = 0; i < 4; ++i) {
                assert.equal(trigger.update(bool), TriggerState.Completed);
            }
            disable(bool);

            assert.equal(trigger.update(bool), TriggerState.None);
        });
    }
});
