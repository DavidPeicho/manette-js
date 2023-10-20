import './style.css';

import {vec2} from 'gl-matrix';

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
import {renderCircle, renderTriangle} from './render';

/* Constants */
const PLAYER_HEIGHT = 60;
const BULLET_SPEED = 0.75;
const ENEMY_RADIUS = 12;
const ENEMY_RADIUS_SQUARE = ENEMY_RADIUS * ENEMY_RADIUS;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="column">
        <h1>Completed</h1>
        <div id="completed"></div>
    </div>
    <canvas></canvas>
`;

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
        lastAction.element = document.createElement('p');
        completed.appendChild(lastAction.element);
    }

    const {count, element} = lastAction;
    element!.innerHTML = count > 0 ? `${action.name} x${count}` : action.name;
    ++lastAction.count;
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

const forward = new BooleanAction('forward');
const backward = new BooleanAction('backward');

manager.add(fire, [new BooleanMapping(mouseInput).setButtons(MouseButtonBinding.Primary)]);
manager.add(jump, [new BooleanMapping(keyboardInput).setButtons(KeyboardBinding.Space)]);
manager.add(forward, [new BooleanMapping(keyboardInput).setButtons(KeyboardBinding.KeyW)]);
manager.add(backward, [new BooleanMapping(keyboardInput).setButtons(KeyboardBinding.KeyS)]);

const canvas = document.getElementsByTagName('canvas')[0];
canvas.width = window.devicePixelRatio * canvas.clientWidth;
canvas.height = window.devicePixelRatio * canvas.clientHeight;
const width = canvas.clientWidth;
const height = canvas.clientHeight;
const ctx = canvas.getContext('2d')!;

const _vector = vec2.create();
const position = vec2.set(vec2.create(), width * 0.5, height - PLAYER_HEIGHT);
const direction = vec2.set(vec2.create(), 0.0, 0.0);
vec2.normalize(direction, direction);
const speed = 1.0;

const enemies = new Array<vec2>(10).fill(null!).map(() => {
    return vec2.set(vec2.create(), Math.random() * width, Math.random() * height);
});
const bullets: {pos: vec2; dir: vec2}[] = [];

fire.completed.add(() => {
    /* Listen for the fire action to trigger. */
    bullets.push({
        pos: vec2.copy(vec2.create(), position),
        dir: vec2.copy(vec2.create(), direction),
    });
});

function update(dt: number) {
    manager.update(dt);

    const pagePosition = vec2.create();
    vec2.set(pagePosition, canvas.offsetLeft, canvas.offsetTop);
    vec2.add(pagePosition, pagePosition, position);

    vec2.sub(direction, mouseInput.absolute, pagePosition);
    vec2.normalize(direction, direction);

    const s = forward.value ? speed : backward.value ? -speed : 0;
    const translate = vec2.scaleAndAdd(vec2.zero(_vector), _vector, direction, s);
    vec2.add(position, position, translate);

    /* Update bullets */
    for (let i = bullets.length - 1; i >= 0; --i) {
        const bullet = bullets[i];

        const dir = vec2.scale(_vector, bullet.dir, BULLET_SPEED * dt);
        vec2.add(bullet.pos, bullet.pos, dir);

        /* Enemy killed */
        let terminated = false;
        for (let enemyId = enemies.length - 1; enemyId >= 0; --enemyId) {
            if (vec2.sqrDist(enemies[enemyId], bullet.pos) > ENEMY_RADIUS_SQUARE) {
                continue;
            }
            enemies.splice(enemyId, 1);
            terminated = true;
            break;
        }

        if (
            terminated ||
            /* Out of bounds */
            bullet.pos[0] < 0.0 ||
            bullet.pos[0] > width ||
            bullet.pos[1] < 0.0 ||
            bullet.pos[1] > height
        ) {
            bullets.splice(i, 1);
        }
    }
}

function render() {
    /* Clear background */
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Draw player */
    renderTriangle(ctx, position, direction, PLAYER_HEIGHT);

    /* Draw ennemies */
    for (const enemy of enemies) {
        renderCircle(ctx, enemy, ENEMY_RADIUS, '#2ecc71', '#27ae60');
    }

    /* Draw bullets */
    for (const bullet of bullets) {
        renderCircle(ctx, bullet.pos, 4, '#cccccc');
    }
}

let previousTime = performance.now();
function animate() {
    const now = performance.now();
    update(now - previousTime);
    render();

    previousTime = now;
    window.requestAnimationFrame(animate);
}
animate();
