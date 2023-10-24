import './style.css';
import keyboardSVG from '/keyboard.svg?raw';
import mouseSVG from '/mouse.svg?raw';

import {
    Action,
    ActionManager,
    Axis2dAction,
    BooleanAction,
    BooleanMapping,
    DownTrigger,
    EmulatedAxis2dMapping,
    KeyboardBinding,
    KeyboardInputSource,
    MouseButtonBinding,
    MouseInputSource,
} from 'haptic-js';

import {Game} from './game.js';

const ui = document.getElementById('ui')!;

/**
 * Append an action in the UI.
 *
 * @param action The action to append.
 */
function updateUI(action: Action) {
    let last = (ui.children[0] as HTMLElement).querySelector('p[action-id]');
    if (!last || last.getAttribute('action-id') !== action.name) {
        const div = document.createElement('div');
        div.classList.add('action');
        div.innerHTML = `
            ${action.source!.id === 'keyboard' ? keyboardSVG : mouseSVG}
            <p action-id=${action.name} count="0">Action</p>
        `;
        last = div.children[1];
        ui.prepend(div);
    }
    const count = `${parseInt(last.getAttribute('count')!) + 1}`;
    last.setAttribute('count', count);
    last.innerHTML = `${action.name} x${count}`;
}

// Contains the game logic, i.e., player, bullets & enemy logic.
const game = new Game(document.getElementsByTagName('canvas')[0]);
window.onresize = () => game.resize();

/*
 * This example contains two sources:
 *
 * - MouseInputSource
 * - KeyboardInputSource
 *
 * Sources process raw inputs from device such as mouse, keyboard,
 * gamepads.
 */

const mouseInput = new MouseInputSource('mouse');
mouseInput.enable(document.body);

const keyboardInput = new KeyboardInputSource('keyboard');
keyboardInput.enable(document.body);

/*
 * Action definition.
 *
 * Every action is used to perform logic in the game, such as
 * moving the player, or firing a bullet.
 */

// Triggered when the player moves.
const move = new Axis2dAction('Move');
// Triggered when the player shoots.
const fire = new BooleanAction('Fire');
fire.completed.add(() => game.spawnBullet()); // Fire bullet upon event.

// Whenever any of the action triggers, update the UI.
for (const action of [fire, move]) {
    action.completed.add(updateUI);
}

/*
 * The ActionManager is in charge of linking actions to their mapping.
 *
 * The manager must be updated by calling `manager.update(dt)` every
 * frame in order to notify the attached triggers.
 */

const manager = new ActionManager([mouseInput, keyboardInput]);
manager.add(fire, [
    new BooleanMapping(mouseInput, MouseButtonBinding.Primary),
    new BooleanMapping(keyboardInput, KeyboardBinding.Enter),
]);
manager.add(move, [
    new EmulatedAxis2dMapping(keyboardInput, {
        // WASD to [-1; 1]
        maxY: KeyboardBinding.KeyW,
        minX: KeyboardBinding.KeyA,
        minY: KeyboardBinding.KeyS,
        maxX: KeyboardBinding.KeyD,
    }).setTrigger(new DownTrigger()),
    new EmulatedAxis2dMapping(keyboardInput, {
        // Arrows to [-1; 1]
        maxY: KeyboardBinding.ArrowUp,
        minX: KeyboardBinding.ArrowLeft,
        minY: KeyboardBinding.ArrowDown,
        maxX: KeyboardBinding.ArrowRight,
    }).setTrigger(new DownTrigger()),
]);

function animate() {
    const now = performance.now();
    const dt = (now - game.previousTime) / 1000.0;

    // The manager needs to be updated with the delta time due to some
    // triggers being time-based.
    manager.update(dt);

    // The move action is considered a "value" action. The value is
    // used as-is to move the player at each frame.
    //
    // This is different than event-based actions, such as the `fire` one.
    game.moveSpeed = move.value[1];
    game.update(dt, mouseInput.absolute);
    game.render();

    game.previousTime = now;
    window.requestAnimationFrame(animate);
}
animate();
