import {vec2} from 'gl-matrix';

/* Constants */

const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 50;
const BULLET_SPEED = 750.0;
const ENEMY_RADIUS = 12;
const ENEMY_RADIUS_SQUARE = ENEMY_RADIUS * ENEMY_RADIUS;

/* Game Logic */

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    /** Canvas width, in CSS pixels */
    width = 0;
    /** Canvas height, in CSS pixels */
    height = 0;
    /** Player move speed. Set to `0` to freeze the player */
    moveSpeed = 0;
    /** Player position */
    position = vec2.create();
    /** Player direction */
    direction = vec2.create();
    /** Alive bullets */
    bullets: {pos: vec2; dir: vec2}[] = [];
    /** Alive ennemies */
    enemies: vec2[] = [];
    /** Previous frame `now()` */
    previousTime = performance.now();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d')!;

        this.resize();

        // Player position defaults to the center of the canvas.
        vec2.set(this.position, this.width * 0.5, this.height - PLAYER_HEIGHT);

        // Initialize enemies at random points.
        for (let i = 0; i < 20; ++i) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.enemies.push(vec2.set(vec2.create(), x, y));
        }
    }

    update(dt: number, mousePos: vec2) {
        // Compute the absolute position of the player on the entire web page.
        // This will allow to get the direction from the player toward the mouse.
        const canvas = this.canvas;
        const pagePos = vec2.set(this.direction, canvas.offsetLeft, canvas.offsetTop);
        vec2.add(this.direction, this.direction, this.position);
        vec2.sub(this.direction, mousePos, pagePos);
        vec2.normalize(this.direction, this.direction);

        // Move the player in the mouse direction.
        const speed = PLAYER_SPEED * this.moveSpeed * dt;
        vec2.scaleAndAdd(this.position, this.position, this.direction, speed);

        /* Update bullets */
        for (let i = this.bullets.length - 1; i >= 0; --i) {
            const bullet = this.bullets[i];

            // Move the bullet along its travel path.
            vec2.scaleAndAdd(bullet.pos, bullet.pos, bullet.dir, BULLET_SPEED * dt);

            /* Enemy killed */
            let terminated = false;
            for (let enemyId = this.enemies.length - 1; enemyId >= 0; --enemyId) {
                if (vec2.sqrDist(this.enemies[enemyId], bullet.pos) > ENEMY_RADIUS_SQUARE) {
                    continue;
                }
                this.enemies.splice(enemyId, 1);
                terminated = true;
                break;
            }

            if (
                terminated ||
                /* Out of bounds */
                bullet.pos[0] < 0.0 ||
                bullet.pos[0] > this.width ||
                bullet.pos[1] < 0.0 ||
                bullet.pos[1] > this.height
            ) {
                this.bullets.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a'; /* Background */
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this._renderTriangle(this.position, this.direction, PLAYER_HEIGHT); /* Player */

        for (const enemy of this.enemies) {
            this._renderCircle(enemy, ENEMY_RADIUS, '#2ecc71', '#27ae60');
        }
        for (const bullet of this.bullets) {
            this._renderCircle(bullet.pos, 4, '#cccccc');
        }
    }

    spawnBullet() {
        this.bullets.push({
            pos: vec2.copy(vec2.create(), this.position),
            dir: vec2.copy(vec2.create(), this.direction),
        });
    }

    resize() {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
    }

    private _renderCircle(
        pos: vec2,
        radius = 1,
        fillStyle: string | CanvasGradient | CanvasPattern = 'green',
        strokeStyle: string | CanvasGradient | CanvasPattern | null = '#CCCCCC'
    ) {
        const ctx = this.ctx;

        const r = radius * window.devicePixelRatio;
        const x = pos[0] * window.devicePixelRatio;
        const y = pos[1] * window.devicePixelRatio;

        ctx.save();

        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.fill();

        ctx.lineWidth = r * 0.1;
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
        }
        ctx.stroke();

        ctx.restore();
    }

    private _renderTriangle(pos: vec2, dir: vec2, heightCSS: number) {
        const ctx = this.ctx;
        const len = 20 * window.devicePixelRatio;
        const height = heightCSS * window.devicePixelRatio * 0.5;

        ctx.save();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.translate(pos[0] * window.devicePixelRatio, pos[1] * window.devicePixelRatio);
        ctx.rotate(-Math.atan2(dir[0], dir[1]));
        ctx.moveTo(-len, -height);
        ctx.lineTo(len, -height);
        ctx.lineTo(0, height);
        ctx.fill();

        ctx.restore();
        ctx.resetTransform();
    }
}
