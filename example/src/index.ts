import './style.css';
// @ts-ignore
import keyboardSVG from '/keyboard.svg?raw';
// @ts-ignore
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
    KeyboardDevice,
    LongPressTrigger,
    MouseBinding,
    MouseDevice,
    PressTrigger,
} from 'manette-js';

import {Game} from './game.js';

// Input interface, contains the list of commands.
const ui = document.getElementById('ui')!;
// Overlay displaying "Restarting...".
const restartOverlay = document.querySelector('.overlay') as HTMLElement;

/**
 * Append an action in the UI.
 *
 * @param action The action to append.
 */
function updateUI(action: Action) {
    let last = (ui.children[0] as HTMLElement).querySelector('p[action-id]');
    if (!last || last.getAttribute('action-id') !== action.id) {
        const div = document.createElement('div');
        div.classList.add('action');
        div.innerHTML = `
            ${action.device!.id === 'keyboard' ? keyboardSVG : mouseSVG}
            <p action-id=${action.id} count="0">Action</p>
        `;
        last = div.children[1];
        ui.prepend(div);
    }
    const count = `${parseInt(last.getAttribute('count')!) + 1}`;
    last.setAttribute('count', count);
    last.innerHTML = `${action.id} x${count}`;
}

// Contains the game logic, i.e., player, bullets & enemy logic.
const game = new Game(document.getElementsByTagName('canvas')[0]);
window.onresize = () => game.resize();

/*
 * This example contains two devices:
 *
 * - MouseDevice
 * - KeyboardDevice
 *
 * Devices process raw inputs from device such as mouse, keyboard,
 * gamepads.
 */

const mouse = new MouseDevice('mouse');
mouse.enable(document.body);

const keyboard = new KeyboardDevice('keyboard');
keyboard.enable(document.body);

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

// Triggered when the player holds the restart button.
const reset = new BooleanAction('ResetGame');
reset.started.add(() => (restartOverlay.style.display = 'initial'));
reset.canceled.add(() => (restartOverlay.style.display = 'none'));
reset.completed.add(() => {
    restartOverlay.style.display = 'none';
    game.reset();
});

// Whenever any of the action is completed, update the UI.
for (const action of [fire, move, reset]) {
    action.completed.add(updateUI);
}

/*
 * The ActionManager is in charge of linking actions to their mapping.
 *
 * The manager must be updated by calling `manager.update(dt)` every
 * frame in order to notify the attached triggers.
 */

const manager = new ActionManager();
manager.add(
    fire,
    [
        new BooleanMapping(mouse, MouseBinding.Primary),
        new BooleanMapping(keyboard, KeyboardBinding.Enter),
    ],
    new PressTrigger()
);

manager.add(
    move,
    [
        new EmulatedAxis2dMapping(keyboard, {
            // WASD to [-1; 1]
            maxY: KeyboardBinding.KeyW,
            minX: KeyboardBinding.KeyA,
            minY: KeyboardBinding.KeyS,
            maxX: KeyboardBinding.KeyD,
        }).setTrigger(new DownTrigger()),
        new EmulatedAxis2dMapping(keyboard, {
            // Arrows to [-1; 1]
            maxY: KeyboardBinding.ArrowUp,
            minX: KeyboardBinding.ArrowLeft,
            minY: KeyboardBinding.ArrowDown,
            maxX: KeyboardBinding.ArrowRight,
        }),
    ],
    new DownTrigger()
);
manager.add(reset, [
    new BooleanMapping(keyboard, KeyboardBinding.Space).setTrigger(
        new LongPressTrigger(1.0)
    ),
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
    game.update(dt, mouse.absolute);
    game.render();

    game.previousTime = now;
    window.requestAnimationFrame(animate);
}
animate();
