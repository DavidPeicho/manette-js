import './style.css';

import {vec2} from 'gl-matrix';

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
import {renderCircle, renderTriangle} from './render';

/* Constants */
const PLAYER_HEIGHT = 60;
const BULLET_SPEED = 0.75;
const ENEMY_RADIUS = 12;
const ENEMY_RADIUS_SQUARE = ENEMY_RADIUS * ENEMY_RADIUS;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Action Mapping</h1>
    <p class="quote">
        Example demonstrating the action mapping for mouse & keyboard sources.</br>
        Move with <b>WASD</b> and shoot with the <b>mouse left</b> button.
    </p>
    <div class="content">
        <div id="completed" class="column background-color">
            <div class="list-gradient"></div>
        </div>
        <canvas/>
    </div>
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

const mouseInput = new MouseInputSource('mouse');
mouseInput.enable(document.body);

const keyboardInput = new KeyboardInputSource('keyboard');
keyboardInput.enable(document.body);

const manager = new ActionManager([mouseInput]);

const fire = new BooleanAction('Fire');
fire.completed.add(completedEvent);

const move = new Axis2dAction('Move');
move.completed.add(completedEvent);

manager.add(fire, [new BooleanMapping(mouseInput).setButtons(MouseButtonBinding.Primary)]);
manager.add(move, [
    new EmulatedAxis2dMapping(keyboardInput)
        .setButtons({
            maxY: KeyboardBinding.KeyW,
            minX: KeyboardBinding.KeyA,
            minY: KeyboardBinding.KeyS,
            maxX: KeyboardBinding.KeyD,
        })
        .setTrigger(new DownTrigger()),
]);

const canvas = document.getElementsByTagName('canvas')[0];
let width = 0;
let height = 0;
resize();

const _vector = vec2.create();
const position = vec2.set(vec2.create(), width * 0.5, height - PLAYER_HEIGHT);
const direction = vec2.set(vec2.create(), 0.0, 0.0);
vec2.normalize(direction, direction);
const speed = 1.0;

const enemies = new Array<vec2>(20).fill(null!).map(() => {
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

    const s = move.value[1] * speed;
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

const ctx = canvas.getContext('2d')!;
function render() {
    /* Render background */
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Render player */
    renderTriangle(ctx, position, direction, PLAYER_HEIGHT);

    /* Render ennemies */
    for (const enemy of enemies) {
        renderCircle(ctx, enemy, ENEMY_RADIUS, '#2ecc71', '#27ae60');
    }

    /* Render bullets */
    for (const bullet of bullets) {
        renderCircle(ctx, bullet.pos, 4, '#cccccc');
    }
}

function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
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

window.onresize = resize;
