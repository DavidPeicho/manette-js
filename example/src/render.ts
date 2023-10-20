import {vec2} from 'gl-matrix';

export function renderCircle(
    ctx: CanvasRenderingContext2D,
    pos: vec2,
    radius = 1,
    fillStyle: string | CanvasGradient | CanvasPattern = 'green',
    strokeStyle: string | CanvasGradient | CanvasPattern | null = '#CCCCCC'
) {
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

export function renderTriangle(
    ctx: CanvasRenderingContext2D,
    pos: vec2,
    dir: vec2,
    heightCSS: number
) {
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
