import { GlLine } from "./gl/object/line";
import { GlCircle } from "./gl/object/circle";
import { GlRectangle } from "./gl/object/rectangle";
import { GlTriangle } from "./gl/object/triangle";
import { GlPath } from "./gl/object/path";
import { Painter } from "./gl/painter";

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * window.devicePixelRatio;
  canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * window.devicePixelRatio;

  document.body.appendChild(canvas);

  return canvas;
}

const renderScene = (gl: WebGLRenderingContext) => {
  const line1 = new GlLine(gl,{
    color: [1, 0, 0.5, 1],
    p1: [0, 0],
    p2: [600, 600],
    width: 1,
  });
  const line2 = new GlLine(gl,{
    color: [0, 1, 0.5, 1],
    p1: [600, 0],
    p2: [0, 600],
    width: 1,
  });
  const circle = new GlCircle(gl,{
    color: [0, 0.5, 0.5, 1],
    p: [300, 300],
    radius: 10,
  });
  const rectangle = new GlRectangle(gl, {
    color: [0.3, 0.5, 1, 1],
    p: [250, 250],
    width: 100,
    height: 200,
  });
  const triangle = new GlTriangle(gl, {
    color: [0.7, 1, 0.2, 1],
    p1: [120, 100],
    p2: [120, 200],
    p3: [400, 200],
  });

  const path = new GlPath(gl, {
    color: [0, 0, 0, 1],
    points: [
      [150, 120],
      [250, 200],
      [250, 200],
      [430, 430],
      [430, 430],
      [610, 250],
      [610, 250],
      [420, 250],
      [420, 250],
      [150, 120],
    ],
    width: 5,
  });

  const painter = new Painter(gl, [
    line1,
    line2,
    rectangle,
    triangle,
    path,
    //circle,
  ]);
  painter.init();
  painter.draw();
};

window.addEventListener('load', () => {
  const canvas = createCanvas();
  const gl = canvas.getContext("webgl", {
    powerPreference: 'high-performance',
  });

  if (!gl) {
    console.log('No Webgl context');

    return;
  }

  renderScene(gl);
});