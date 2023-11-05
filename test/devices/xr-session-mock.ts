import {XRButtonBinding, toRawButton} from '../../src/devices/xr-device.js';
import {EventMock} from './event-mock.js';

interface GamepadButtonMock {
    pressed: boolean;
    touched: boolean;
    value: number;
}

export class XRGamepadMock {
    buttons: GamepadButtonMock[] = [
        {pressed: false, touched: false, value: 0.0},
        {pressed: false, touched: false, value: 0.0},
        {pressed: false, touched: false, value: 0.0},
        {pressed: false, touched: false, value: 0.0},
        {pressed: false, touched: false, value: 0.0},
        {pressed: false, touched: false, value: 0.0},
    ];
}

export class XRInputSourceMock {
    gamepad = new XRGamepadMock();
    handedness = 'left';
}

export class XRSessionMock extends EventMock {
    inputSources = [new XRInputSourceMock()];
}
