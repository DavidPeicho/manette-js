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

// Contains the game logic: Move player, update bullets & enemies.
const game = new Game(document.getElementsByTagName('canvas')[0]);
window.onresize = () => game.resize();

const completed = document.getElementById('completed')!;

const lastAction = {
    actionId: '',
    element: null as HTMLElement | null,
    count: 0,
};

function completedEvent(action: Action) {
    if (action.name != lastAction.actionId) {
        lastAction.actionId = action.name;
        lastAction.count = 0;

        const svg = action.source?.id === 'mouse' ? mouseSVG : keyboardSVG;

        const template = document.createElement('div');
        template.innerHTML = `
            <div class="action">
                ${svg}
                <p>Action</p>
            </div>
        `;

        completed.prepend(template);
        lastAction.element = template.getElementsByTagName('p')[0];
    }

    const {count, element} = lastAction;
    element!.innerHTML = count > 0 ? `${action.name} x${count}` : action.name;
    ++lastAction.count;
}

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
    action.completed.add(completedEvent);
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

    manager.update(dt);

    game.moveSpeed = move.value[1];
    game.update(dt, mouseInput.absolute);
    game.render();

    game.previousTime = now;
    window.requestAnimationFrame(animate);
}
animate();
