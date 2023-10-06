import './style.css';

import {
    ActionManager,
    BooleanAction,
    BooleanMapping,
    MouseButtonBinding,
    MouseInputSource,
} from 'haptic-js';

const mouseInput = new MouseInputSource();
mouseInput.enable(document.body);

const manager = new ActionManager([mouseInput]);

const fire = new BooleanAction('fire');
fire.completed.add(() => console.log('fire'));

manager.add(fire, [new BooleanMapping(mouseInput).setButtons(MouseButtonBinding.Primary)]);

function animate() {
    manager.update(0.1);

    window.requestAnimationFrame(animate);
}

animate();
