import test from 'node:test';

import {MouseDevice, MouseBinding} from '../../src/devices/mouse-device.js';
import {HTMLElementMock} from './element-mock.js';
import assert from 'node:assert';

function create(): {mouse: MouseDevice; elt: HTMLElementMock} {
    const elt = new HTMLElementMock();
    const mouse = new MouseDevice('mouse');
    mouse.enable(elt as any as HTMLElement);
    return {mouse, elt};
}

test('Mouse', async (t) => {
    await t.test('.pressed()', (_) => {
        const {mouse, elt} = create();
        /* No other key should be pressed. */
        for (const key in MouseBinding) {
            assert(!mouse.pressed(MouseBinding[key as keyof MouseBinding]));
        }
    });
});
