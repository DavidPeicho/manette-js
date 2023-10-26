import {vec2} from 'gl-matrix';

/* Constants */

const PLAYER_HEIGHT = 60;
const PLAYER_SPEED = 50;
const BULLET_SPEED = 750.0;
const ENEMY_RADIUS = 12;
const ENEMY_RADIUS_SQUARE = ENEMY_RADIUS * ENEMY_RADIUS;

/**
 * Game instance.
 *
 * The entire game logic is added in this class to make
 * the example's action mapping setup easy to follow.
 */
export class Game {
    /** Canvas */
    canvas: HTMLCanvasElement;
    /** Canvas 2d context for drawing */
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
        this.reset();
    }

    update(dt: number, mousePos: vec2) {
        // Compute the absolute position of the player on the entire web page.
        // This will allow to get the direction from the player toward the mouse.
        const canvas = this.canvas;
        const bounds = canvas.getBoundingClientRect();
        const pagePos = vec2.set(this.direction, bounds.x, bounds.y);
        vec2.add(this.direction, this.direction, this.position);
        vec2.sub(this.direction, mousePos, pagePos);
        vec2.normalize(this.direction, this.direction);

        // Move the player in the mouse direction.
        const speed = PLAYER_SPEED * this.moveSpeed * dt;
        vec2.scaleAndAdd(this.position, this.position, this.direction, speed);

        // Update bullets & handle enemy destruction.
        for (let bulletId = this.bullets.length - 1; bulletId >= 0; --bulletId) {
            const bullet = this.bullets[bulletId];

            // Move the bullet along its travel path.
            vec2.scaleAndAdd(bullet.pos, bullet.pos, bullet.dir, BULLET_SPEED * dt);

            // Check if the bullet is out-of-bounds.
            if (!this._pointInsideCanvas(bullet.pos)) {
                this.bullets.splice(bulletId, 1);
                break;
            }

            // Check for bullet hiting enemies.
            for (let enemyId = this.enemies.length - 1; enemyId >= 0; --enemyId) {
                if (vec2.sqrDist(this.enemies[enemyId], bullet.pos) > ENEMY_RADIUS_SQUARE) {
                    continue;
                }
                this.enemies.splice(enemyId, 1);
                this.bullets.splice(bulletId, 1);
                break;
            }
        }
    }

    /** Render the player, enemies, and bullets to the canvas. */
    render() {
        this.ctx.fillStyle = '#1a1a1a'; // Background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this._renderTriangle(this.position, this.direction, PLAYER_HEIGHT);

        for (const enemy of this.enemies) {
            this._renderCircle(enemy, ENEMY_RADIUS, '#2ecc71', '#27ae60');
        }
        for (const bullet of this.bullets) {
            this._renderCircle(bullet.pos, 4, '#cccccc');
        }
    }

    /** Spawn a new bullet at the player position. */
    spawnBullet() {
        this.bullets.push({
            pos: vec2.copy(vec2.create(), this.position),
            dir: vec2.copy(vec2.create(), this.direction),
        });
    }

    /** Resize the canvas */
    resize() {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
    }

    reset() {
        // Initialize enemies at random points.
        this.enemies.length = 0;
        for (let i = 0; i < 20; ++i) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.enemies.push(vec2.set(vec2.create(), x, y));
        }
        // Player position defaults to the center of the canvas.
        vec2.set(this.position, this.width * 0.5, this.height - PLAYER_HEIGHT);
    }

    /**
     * Render a circle.
     *
     * @param pos Center position of the circle.
     * @param radius The radius of the circle, in **css pixels**.
     * @param fillStyle The fill style.
     * @param strokeStyle The stroke style.
     */
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

    /**
     * Render a triangle.
     *
     * @param pos Center of the triangle.
     * @param dir Direction to orient the triangle toward.
     * @param heightCSS The height of the isolceles triangle, in **css pixels**.
     */
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

    /**
     * Check if a 2d point is inside a rectangle.
     *
     * @param p The point to check.
     * @returns `true` if the point is inside the rectangle, `false` otherwise.
     */
    private _pointInsideCanvas(p: vec2): boolean {
        return p[0] >= 0.0 && p[0] < this.width && p[1] >= 0.0 && p[1] < this.height;
    }
}
