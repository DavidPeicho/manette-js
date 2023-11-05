import assert from 'node:assert';
import test, {describe} from 'node:test';

import {Axis2dAction, BooleanAction, TriggerState} from '../src/actions.js';
import {
    DownTrigger,
    LongPressTrigger,
    PressTrigger,
    ReleaseTrigger,
} from '../src/trigger.js';

describe('Trigger', (_) => {
    test('bool actuation', (_) => {
        const trigger = new DownTrigger();
        const bool = new BooleanAction('action');
        bool.value = true;

        assert.equal(trigger.update(bool), TriggerState.Completed);
        trigger.setAcctuation(2.0);
        assert.equal(trigger.update(bool), TriggerState.None);
        trigger.setAcctuation(0.9);
        assert.equal(trigger.update(bool), TriggerState.Completed);
    });

    test('axis2d actuation', (_) => {
        const trigger = new DownTrigger();
        const bool = new Axis2dAction('action');
        bool.value[0] = 0.5;
        bool.value[1] = 0.5;

        trigger.setAcctuation(1.0);
        assert.equal(trigger.update(bool), TriggerState.None);
        trigger.setAcctuation(0.45);
        assert.equal(trigger.update(bool), TriggerState.Completed);
    });
});

describe('DownTrigger', (_) => {
    test('.update()', (_) => {
        const bool = new BooleanAction('action');
        const trigger = new DownTrigger();

        assert.equal(trigger.update(bool), TriggerState.None);

        bool.value = true;
        for (let i = 0; i < 4; ++i) {
            assert.equal(trigger.update(bool), TriggerState.Completed);
        }
        bool.value = false;

        assert.equal(trigger.update(bool), TriggerState.None);
    });
});

describe('PressTrigger', (_) => {
    test('.update()', (_) => {
        const bool = new BooleanAction('action');
        const trigger = new PressTrigger();

        assert.equal(trigger.update(bool), TriggerState.None);

        bool.value = true;
        assert.equal(trigger.update(bool), TriggerState.Completed);
        assert.equal(trigger.update(bool), TriggerState.None);
        assert.equal(trigger.update(bool), TriggerState.None);

        bool.value = false;
        assert.equal(trigger.update(bool), TriggerState.None);
        bool.value = true;
        assert.equal(trigger.update(bool), TriggerState.Completed);
    });
});

describe('ReleaseTrigger', (_) => {
    test('.update()', (_) => {
        const bool = new BooleanAction('action');
        const trigger = new ReleaseTrigger();

        assert.equal(trigger.update(bool), TriggerState.None);

        bool.value = true;
        for (let i = 0; i < 4; ++i) {
            assert.equal(trigger.update(bool), TriggerState.Ongoing);
        }

        bool.value = false;
        assert.equal(trigger.update(bool), TriggerState.Completed);
        assert.equal(trigger.update(bool), TriggerState.None);
    });
});

describe('LongPressTrigger', (_) => {
    test('.update()', (_) => {
        const bool = new BooleanAction('action');
        const trigger = new LongPressTrigger(1.0);

        assert.equal(trigger.update(bool), TriggerState.None);

        bool.value = true;
        for (let i = 0; i < 4; ++i) {
            assert.equal(trigger.update(bool, 0.2), TriggerState.Ongoing);
        }
        assert.equal(trigger.update(bool, 0.21), TriggerState.Completed);
        assert.equal(trigger.update(bool), TriggerState.None);

        // Ensure it doesn't complete again after another second
        assert.equal(trigger.update(bool, 1.0), TriggerState.None);

        bool.value = false;
    });

    test('.duration', (_) => {
        const bool = new BooleanAction('action');
        const trigger = new LongPressTrigger(Number.POSITIVE_INFINITY);

        bool.value = true;
        trigger.duration = 0.99;
        assert.equal(trigger.update(bool, 0.9), TriggerState.Ongoing);
        assert.equal(trigger.update(bool, 0.1), TriggerState.Completed);

        bool.value = false;
        assert.equal(trigger.update(bool, 10.0), TriggerState.None);

        bool.value = true;
        trigger.duration = 100.0;
        assert.equal(trigger.update(bool, 10.0), TriggerState.Ongoing);
        assert.equal(trigger.update(bool, 90.1), TriggerState.Completed);
    });
});
