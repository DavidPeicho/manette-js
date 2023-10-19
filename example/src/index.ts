import './style.css';

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

const completed = document.getElementById('completed')!;

function completedEvent(action: Action) {
    const element = document.createElement('p');
    element.innerHTML = action.name;
    completed.appendChild(element);
}

const mouseInput = new MouseInputSource();
mouseInput.enable(document.body);

const keyboardInput = new KeyboardInputSource();
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
