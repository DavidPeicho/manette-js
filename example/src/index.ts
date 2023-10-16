import './style.css';

import {
    Action,
    ActionManager,
    BooleanAction,
    BooleanMapping,
    MouseButtonBinding,
    MouseInputSource,
} from 'haptic-js';

const app = document.getElementById('app')!;
const started = document.getElementById('started')!;
const completed = document.getElementById('completed')!;

function completedEvent(action: Action) {
    const element = document.createElement('p');
    element.innerHTML = action.name;
    completed.appendChild(element);
}

const mouseInput = new MouseInputSource();
mouseInput.enable(document.body);

const manager = new ActionManager([mouseInput]);

const fire = new BooleanAction('fire');
fire.completed.add(completedEvent);

manager.add(fire, [new BooleanMapping(mouseInput).setButtons(MouseButtonBinding.Primary)]);

function animate() {
    manager.update(0.1);
    window.requestAnimationFrame(animate);
}

animate();
