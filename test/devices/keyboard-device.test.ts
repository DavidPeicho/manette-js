import test from 'node:test';

import {KeyboardBinding, KeyboardDevice} from '../../src/devices/keyboard-device.js';
import {HTMLElementMock} from './element-mock.js';
import assert from 'node:assert';

function create(): {keyboard: KeyboardDevice; elt: HTMLElementMock} {
    const elt = new HTMLElementMock();
    const keyboard = new KeyboardDevice('keyboard');
    keyboard.enable(elt as any as HTMLElement);
    return {keyboard, elt};
}

test('Keyboard', async (t) => {
    await t.test('.pressed()', (_) => {
        const {keyboard, elt} = create();
        assert(!keyboard.pressed(KeyboardBinding.Space));

        elt.keydown('Space');
        assert(keyboard.pressed(KeyboardBinding.Space));

        /* No other key should be pressed. */
        for (const key in KeyboardBinding) {
            if (key === 'Space') continue;
            assert(!keyboard.pressed(KeyboardBinding[key as keyof KeyboardBinding]));
        }

        elt.keyup('Space');
        assert(!keyboard.pressed(KeyboardBinding.Space));
    });

    await t.test('.pressed() multiple keys', (_) => {
        const {keyboard, elt} = create();
        elt.keydown('Space', 'KeyA', 'BracketLeft');
        assert(keyboard.pressed(KeyboardBinding.Space));
        assert(keyboard.pressed(KeyboardBinding.KeyA));
        assert(keyboard.pressed(KeyboardBinding.BracketLeft));
    });
});
