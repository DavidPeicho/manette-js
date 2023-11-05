import assert from 'node:assert';
import test, {describe} from 'node:test';

import {MouseDevice, MouseBinding, toRawButton} from '../../src/devices/mouse-device.js';
import {HTMLElementMock} from './element-mock.js';
import {enumKeys} from '../utils.js';

function create(): {device: MouseDevice; elt: HTMLElementMock} {
    const elt = new HTMLElementMock();
    const device = new MouseDevice('mouse');
    device.enable(elt as any as HTMLElement);
    return {device, elt};
}

describe('Mouse', (_) => {
    test('.pressed() on down events', (_) => {
        const {device, elt} = create();
        assert(!device.pressed(MouseBinding.Secondary));

        elt.pointerdown(toRawButton(MouseBinding.Secondary));
        assert(device.pressed(MouseBinding.Secondary));

        // No other button should be pressed
        const keys = enumKeys(MouseBinding);
        for (const key of keys) {
            if (key === 'Secondary') continue;
            assert(!device.pressed(MouseBinding[key as keyof MouseBinding]));
        }
    });

    test('.pressed() on up events', (_) => {
        const {device, elt} = create();

        const keys = enumKeys(MouseBinding);

        // Press all button first
        for (const key of keys) {
            elt.pointerdown(toRawButton(MouseBinding[key]));
        }

        // Release a few buttons
        const release = ['Primary', 'Fourth'];
        for (const key of release) {
            const binding = MouseBinding[key as keyof MouseBinding];
            elt.pointerup(toRawButton(binding));
            assert(!device.pressed(MouseBinding[key]));
        }

        // Ensure all non-released buttons are still pressed
        for (const key of keys) {
            if (release.includes(key)) continue;
            assert(device.pressed(MouseBinding[key as keyof MouseBinding]));
        }
    });

    test('.disable()', (_) => {
        const {device, elt} = create();
        device.disable();

        elt.pointerdown(toRawButton(MouseBinding.Primary));
        assert(!device.pressed(MouseBinding.Primary));
    });

    test('.validateButton()', (_) => {
        const {device} = create();

        for (const key in MouseBinding) {
            assert.doesNotThrow(() => {
                device.validateButton(MouseBinding[key as keyof MouseBinding]);
            });
        }

        assert.throws(() => device.validateButton(-1 as MouseBinding));
        assert.throws(() => device.validateButton(10000 as MouseBinding));
    });
});
