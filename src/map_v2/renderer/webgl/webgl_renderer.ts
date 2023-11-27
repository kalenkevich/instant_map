import { mat3 } from 'gl-matrix';
import { createShader, createProgram } from './webgl_utils';
import { Renderer, MapStyles } from '../renderer';
import { PbfMapTile, PbfTileLayer } from '../../tile/pbf/pbf_tile';

////////////
// shaders
////////////
const vertexShaderSource = `
  attribute vec2 a_position;

  uniform mat3 u_matrix;

  void main() {
    gl_PointSize = 3.0;

    vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    
    // Clip space
    // vec2 zeroToTwo = position * 2.0;
    // vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(position, 0, 1);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

export class WebGlRenderer implements Renderer {
  private positionBuffer: WebGLBuffer;
  private program: WebGLProgram;
  private matrixLocation: any;
  private colorLocation: any;
  private canvas: HTMLCanvasElement;
  private gl?: WebGLRenderingContext;
  private positionAttributeLocation = 0;

  constructor(private readonly rootEl: HTMLElement, private devicePixelRatio: number) {
    this.canvas = this.createCanvasEl();
  }

  init() {
    this.rootEl.appendChild(this.canvas);

    const gl = (this.gl = this.canvas.getContext('webgl'));

    // get GL context
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup program
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // create buffers
    this.positionBuffer = gl.createBuffer();

    this.matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    this.colorLocation = gl.getUniformLocation(program, 'u_color');

    // save gl references
    this.program = program;
  }

  destroy() {}

  protected createCanvasEl(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const width = this.rootEl.offsetWidth;
    const height = this.rootEl.offsetHeight;

    canvas.width = width * this.devicePixelRatio;
    canvas.height = height * this.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.background = 'transparent';

    return canvas;
  }

  public resize(width: number, height: number) {
    if (!this.canvas) {
      return;
    }

    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  render(tiles: PbfMapTile[], matrix: mat3, styles: MapStyles) {
    const gl = this.gl;

    // set matrix uniform
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    for (const tile of tiles) {
      let tileLayers = tile.getLayers();

      for (const tileLayer of tileLayers) {
        const { layer, vertices, features } = tileLayer as PbfTileLayer;
        const color = styles.layers[layer].map(n => n / 255); // RBGA to WebGL

        // set color uniform
        gl.uniform4fv(this.colorLocation, color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.positionAttributeLocation);

        for (const feature of features) {
          const size = 2;
          const normalize = false;
          const stride = 0;
          const offset = feature.pointer.offset * Float32Array.BYTES_PER_ELEMENT;
          gl.vertexAttribPointer(this.positionAttributeLocation, size, gl.FLOAT, normalize, stride, offset);

          // draw
          gl.drawArrays(feature.primitiveType, 0, feature.numElements);
        }
      }
    }
  }
}
