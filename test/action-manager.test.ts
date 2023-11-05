import assert from 'node:assert';
import test, {describe} from 'node:test';

import {
    ActionManager,
    BooleanAction,
    BooleanMapping,
    DownTrigger,
    KeyboardDevice,
    MouseBinding,
    MouseDevice,
    PressTrigger,
} from '../src/';

import {HTMLElementMock} from './devices/element-mock';

function element(device: MouseDevice | KeyboardDevice): HTMLElementMock {
    return device.element as unknown as HTMLElementMock;
}

describe('Action Manager', (_) => {
    const mouse = new MouseDevice('mouse');
    mouse.enable(new HTMLElementMock() as unknown as HTMLElement);

    test('mapping priority', (_) => {
        const action = new BooleanAction('action');

        const primaryBinding = new BooleanMapping(mouse, MouseBinding.Primary);
        const secondaryBinding = new BooleanMapping(mouse, MouseBinding.Secondary);
        const manager = new ActionManager();
        manager.add(action, [primaryBinding, secondaryBinding]);

        element(mouse).pointerdown(MouseDevice.rawButton(MouseBinding.Primary));
        element(mouse).pointerdown(MouseDevice.rawButton(MouseBinding.Secondary));
        manager.update();
        assert.equal(action.mapping, primaryBinding);

        element(mouse).pointerup(MouseDevice.rawButton(MouseBinding.Primary));
        manager.update();
        assert.equal(action.mapping, secondaryBinding);
    });

    test('override trigger', (_) => {
        const action = new BooleanAction('action');

        const binding1 = new BooleanMapping(mouse, MouseBinding.Primary);
        const binding2 = new BooleanMapping(mouse, MouseBinding.Secondary);
        const manager = new ActionManager();
        manager.add(action, [binding1, binding2], new DownTrigger());

        assert(binding1.trigger instanceof DownTrigger);
        assert(binding2.trigger instanceof DownTrigger);

        binding1.trigger = new PressTrigger();
        manager.setMapping(manager.index(action)!, [binding1, binding2]);
        assert(binding1.trigger instanceof PressTrigger);
        assert(binding2.trigger instanceof DownTrigger);
    });
});
