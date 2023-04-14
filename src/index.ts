import { FeatureCollection } from "geojson";
import { GlLine } from "./gl/object/line";
import { GlCircle } from "./gl/object/circle";
import { GlRectangle } from "./gl/object/rectangle";
import { GlTriangle } from "./gl/object/triangle";
import { GlPath } from "./gl/object/path";
import { Painter } from "./gl/painter";
import GEO_JSON_SAMPLE from './geojson/data/slonim-export-v1_geojson.json';
import GEO_JSON_SAMPLE_V3 from './geojson/data/slonim-export-v3_geojson.json';
import {renderGeoJson} from './geojson/geojson_viewer';

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * window.devicePixelRatio;
  canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * window.devicePixelRatio;

  document.body.appendChild(canvas);

  return canvas;
}

const renderSceneV1 = (gl: WebGLRenderingContext) => {
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
      [430, 430],
      [610, 250],
      [420, 250],
      [150, 120],
    ],
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

const renderSceneV2 = (gl: WebGLRenderingContext) => {
  renderGeoJson(gl, GEO_JSON_SAMPLE_V3 as FeatureCollection);
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

  renderSceneV1(gl);
  //renderSceneV2(gl);
});