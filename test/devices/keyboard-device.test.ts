import assert from 'node:assert';
import test, {describe} from 'node:test';

import {KeyboardBinding, KeyboardDevice} from '../../src/devices/keyboard-device.js';
import {HTMLElementMock} from './element-mock.js';
import {enumKeys} from '../utils.js';

function create(): {keyboard: KeyboardDevice; elt: HTMLElementMock} {
    const elt = new HTMLElementMock();
    const keyboard = new KeyboardDevice('keyboard');
    keyboard.enable(elt as any as HTMLElement);
    return {keyboard, elt};
}

describe('Keyboard', (_) => {
    test('.pressed() for keydown', (_) => {
        const {keyboard, elt} = create();
        assert(!keyboard.pressed(KeyboardBinding.Space));

        elt.keydown('Space');
        assert(keyboard.pressed(KeyboardBinding.Space));

        // No other key should be pressed
        const keys = enumKeys(KeyboardBinding);
        for (const key of keys) {
            if (key === 'Space') continue;
            assert(!keyboard.pressed(KeyboardBinding[key as keyof KeyboardBinding]));
        }
    });

    test('.pressed() for keyup', (_) => {
        const {keyboard, elt} = create();

        // Press all keys first
        const keys = enumKeys(KeyboardBinding);
        for (const key of keys) {
            elt.keydown(key);
            assert(keyboard.pressed(KeyboardBinding[key as keyof KeyboardBinding]));
        }

        // Release a few keys
        const release = ['F1', 'Digit5', 'KeyA'];
        for (const key of release) {
            elt.keyup(key);
            assert(!keyboard.pressed(KeyboardBinding[key]));
        }

        // Ensure all non-released keys are still pressed
        for (const key of keys) {
            if (release.includes(key)) continue;
            assert(keyboard.pressed(KeyboardBinding[key as keyof KeyboardBinding]));
        }
    });

    test('.disable()', (_) => {
        const {keyboard, elt} = create();
        keyboard.disable();

        elt.keydown('KeyA');
        assert(!keyboard.pressed(KeyboardBinding.KeyA));
    });

    test('.validateButton()', (_) => {
        const {keyboard} = create();

        for (const key in KeyboardBinding) {
            assert.doesNotThrow(() => {
                keyboard.validateButton(KeyboardBinding[key as keyof KeyboardBinding]);
            });
        }

        assert.throws(() => keyboard.validateButton(-1 as KeyboardBinding));
        assert.throws(() => keyboard.validateButton(10000 as KeyboardBinding));
    });
});
