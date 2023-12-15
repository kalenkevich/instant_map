import { WebGlPointBufferredGroup } from '../webgl_map_object';
import { ExtendedWebGLRenderingContext, ObjectProgram } from '../object/object_program';

const VERTEX_SHADER_SOURCE = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  uniform mat3 u_matrix;
  uniform float u_zoom;

  attribute vec2 a_position;
  attribute vec4 a_color;

  varying vec4 v_color;

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

  mat3 scale(mat3 a, vec2 v) {
    return mat3(
      v.x * a[0].x, v.x * a[0].y, v.x * a[0].z,
      v.y * a[1].x, v.y * a[1].y, v.y * a[1].z, 
      a[2].x, a[2].y, a[2].z
    );
  }

  mat3 unscale(mat3 a, vec2 v) {
    return mat3(
      a[0].x / v.x, a[0].y / v.x, a[0].z / v.x,
      a[1].x / v.y, a[1].y / v.y, a[1].z / v.y, 
      a[2].x, a[2].y, a[2].z
    );
  }

  vec2 applyMatrix(vec2 position) {
    // float zoomScale = pow(2.0, u_zoom);
    // mat3 mat = unscale(u_matrix, vec2(zoomScale, zoomScale));

    return (u_matrix * vec3(position, 1)).xy;
  }

  void main() {
    v_color = a_color;
    gl_Position = vec4(applyMatrix(clipSpace(mercatorProject(a_position))), 0, 1);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

export class PointProgram extends ObjectProgram {
  constructor(
    protected readonly gl: ExtendedWebGLRenderingContext,
    protected readonly vertexShaderSource: string = VERTEX_SHADER_SOURCE,
    protected readonly fragmentShaderSource: string = FRAGMENT_SHADER_SOURCE
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  drawObjectGroup(objectGroup: WebGlPointBufferredGroup) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.vertecies.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.a_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objectGroup.color.buffer, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, objectGroup.numElements);

    gl.bindVertexArray(null);
  }
}
