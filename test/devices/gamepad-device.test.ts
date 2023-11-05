import assert from 'node:assert';
import test, {describe} from 'node:test';

import {
    Handedness,
    XRButtonBinding,
    XRDevice,
    toRawButton,
} from '../../src/devices/xr-device.js';
import {enumKeys} from '../utils.js';
import {XRGamepadMock, XRSessionMock} from './xr-session-mock.js';

function create(): {device: XRDevice; gamepad: XRGamepadMock} {
    const mock = new XRSessionMock();
    mock.inputSources[0].handedness = 'left';

    const device = new XRDevice('xr', Handedness.Left);
    device.enable(mock as unknown as XRSession);
    return {device, gamepad: mock.inputSources[0].gamepad};
}

describe('Gamepad', (_) => {
    test('.pressed() on down events', (_) => {
        const {device, gamepad} = create();

        gamepad.buttons[toRawButton(XRButtonBinding.Trigger)].pressed = true;
        device.update();
        assert(device.pressed(XRButtonBinding.Trigger));

        // No other button should be pressed
        const keys = enumKeys(XRButtonBinding);
        for (const key of keys) {
            if (key === 'Trigger') continue;
            assert(!device.pressed(XRButtonBinding[key as keyof XRButtonBinding]));
        }
    });

    test('.pressed() on up events', (_) => {
        const {device, gamepad} = create();

        const keys = enumKeys(XRButtonBinding);

        // Press & release a few buttons
        const release = ['Joystick', 'PrimaryButton'];
        for (const key of keys) {
            const pressed = !release.includes(key);
            const binding = XRButtonBinding[key];
            gamepad.buttons[toRawButton(binding)].pressed = pressed;
        }

        device.update();

        // Ensure all non-released buttons are still pressed
        for (const key of keys) {
            const expected = !release.includes(key);
            assert.equal(device.pressed(XRButtonBinding[key]), expected);
        }
    });

    test('.disable()', (_) => {
        const {device, gamepad} = create();

        device.disable();
        gamepad.buttons[toRawButton(XRButtonBinding.Trigger)].pressed = true;
        device.update();

        assert(!device.pressed(XRButtonBinding.Trigger));
    });

    test('.handedness()', (_) => {
        const mock = new XRSessionMock();
        mock.inputSources[0].handedness = 'left';
        const buttons = mock.inputSources[0].gamepad.buttons;

        const device = new XRDevice('xr', Handedness.Right);
        device.enable(mock as unknown as XRSession);

        // Handedness doesn't match, events shouldn't be fired
        buttons[toRawButton(XRButtonBinding.Trigger)].pressed = true;
        device.update();
        assert(!device.pressed(XRButtonBinding.Trigger));

        // Handedness match, events is fired
        mock.inputSources[0].handedness = 'right';
        device.enable(mock as unknown as XRSession);

        device.update();
        assert(device.pressed(XRButtonBinding.Trigger));
    });
});
