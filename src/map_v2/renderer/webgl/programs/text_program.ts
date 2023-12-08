import { PolygonProgram } from './polygon_program';
import { ExtendedWebGLRenderingContext } from './program';

const VERTEX_SHADER_SOURCE = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  attribute vec2 a_position;

  uniform mat3 u_matrix;
  uniform float u_zoom;

  float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
  }

  float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(QUARTER_PI + (lat * PI) / 360.0)))) / 360.0;
  }

  vec2 mercatorProject(vec2 lngLat) {
    float x = mercatorXfromLng(lngLat.x);
    float y = mercatorYfromLat(lngLat.y);

    return vec2(x, y);
  }

  vec2 clipSpace(vec2 position) {
    return vec2(
      -1.0 + position.x * 2.0,
      +1.0 - position.y * 2.0);
  }

  vec2 applyMatrix(vec2 position) {
    return (u_matrix * vec3(position, 1)).xy;
  }

  vec2 applyZoomScale(vec2 position) {
    float zoomScale = 1.0 / u_zoom;

    return mat2(zoomScale, 1, 1, zoomScale) * position;
  }

  void main() {
    gl_Position = vec4(applyMatrix(clipSpace(mercatorProject(a_position))), 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = vec4(0,0,0,1);
  }
`;

export class TextProgram extends PolygonProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER_SOURCE,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER_SOURCE
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }
}
