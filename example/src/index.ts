import './style.css';
import keyboardSVG from '/keyboard.svg?raw';
import mouseSVG from '/mouse.svg?raw';

import {
    Action,
    ActionManager,
    BooleanAction,
    BooleanMapping,
    KeyboardBinding,
    KeyboardInputSource,
    MouseButtonBinding,
    MouseInputSource,
} from 'haptic-js';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="column">
        <h1>Input Sources</h1>
        <div id="sources" class="icon-container">
            <div id="keyboard-icon">${keyboardSVG}</div>
            <div id="mouse-icon">${mouseSVG}</div>
        </div>
    </div>
    <div class="column">
        <h1>Started</h1>
        <div id="started"></div>
    </div>
    <div class="column">
        <h1>Completed</h1>
        <div id="completed"></div>
    </div>
`;

const completed = document.getElementById('completed')!;
const keyboardDom = document.getElementById('keyboard-icon')!;
const mouseDom = document.getElementById('mouse-icon')!;

const lastAction = {
    actionId: '',
    element: null as HTMLElement | null,
    count: 0,
};

function completedEvent(action: Action) {
    if (action.name != lastAction.actionId) {
        lastAction.actionId = action.name;
        lastAction.count = 0;
        lastAction.element = document.createElement('p');
        completed.appendChild(lastAction.element);
    }

    const {count, element} = lastAction;
    element!.innerHTML = count > 0 ? `${action.name} x${count}` : action.name;
    ++lastAction.count;
}

const mouseInput = new MouseInputSource();
mouseInput.onPress.add(() => mouseDom.classList.add('glow'));
mouseInput.onRelease.add(() => mouseDom.classList.remove('glow'));
mouseInput.enable(document.body);

const keyboardInput = new KeyboardInputSource();
keyboardInput.onPress.add(() => keyboardDom.classList.add('glow'));
keyboardInput.onRelease.add(() => keyboardDom.classList.remove('glow'));
keyboardInput.enable(document.body);

const manager = new ActionManager([mouseInput]);

const fire = new BooleanAction('fire');
fire.completed.add(completedEvent);

const jump = new BooleanAction('jump');
jump.completed.add(completedEvent);

manager.add(fire, [new BooleanMapping(mouseInput).setButtons(MouseButtonBinding.Primary)]);
manager.add(jump, [new BooleanMapping(keyboardInput).setButtons(KeyboardBinding.Space)]);

function animate() {
    manager.update(0.1);
    window.requestAnimationFrame(animate);
}

animate();
