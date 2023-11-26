import { vec3, mat3 } from 'gl-matrix';
import { createShader, createProgram, getPrimitiveType } from './webgl_utils';
import { MapTile } from '../../tile/tile';
import { Projection } from '../../geo/projection/projection';
import { Renderer, MapStyles } from '../renderer';
import { PbfTileLayer } from '../../tile/pbf/pbf_tile';

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

  constructor(
    private readonly gl: WebGLRenderingContext,
    private pixelRatio: number,
    private readonly overlay: HTMLElement,
    private readonly projection: Projection
  ) {}

  init() {
    const gl = this.gl;
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

  render(tiles: MapTile[], matrix: mat3, styles: MapStyles) {
    const gl = this.gl;

    // set matrix uniform
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    for (const tile of tiles) {
      let tileLayers = tile.getLayers();

      for (const tileLayer of tileLayers) {
        const { layer, type, vertices } = tileLayer as PbfTileLayer;

        if (styles.disabledLayers.includes(layer)) {
          return;
        }

        const color = styles.layers[layer].map(n => n / 255); // RBGA to WebGL

        // set color uniform
        gl.uniform4fv(this.colorLocation, color);

        // create buffer for vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // setup position attribute
        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);

        // tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;
        const dataType = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        let offset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, dataType, normalize, stride, offset);

        // draw
        const primitiveType = getPrimitiveType(gl, type);
        offset = 0;
        const count = vertices.length / 2;
        gl.drawArrays(primitiveType, offset, count);
      }
    }
  }

  renderTilesBorder(tiles: MapTile[], matrix: mat3, canvasWidth: number, canvasHeight: number) {
    const gl = this.gl;
    for (const tile of tiles) {
      // todo: move up in other tile loop
      const colorLocation = gl.getUniformLocation(this.program, 'u_color');
      gl.uniform4fv(colorLocation, [1, 0, 0, 1]);
      //  geometryToVertices(tilebelt.tileToGeoJSON(tile.ref))
      const tileVertices = tile.getVerticies(this.projection);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(tileVertices), gl.STATIC_DRAW);
      // setup position attribute
      const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(positionAttributeLocation);
      // tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      const size = 2;
      const dataType = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      let offset = 0;
      gl.vertexAttribPointer(positionAttributeLocation, size, dataType, normalize, stride, offset);
      // draw
      const primitiveType = gl.LINES;
      offset = 0;
      const count = tileVertices.length / 2;
      gl.drawArrays(primitiveType, offset, count);
      // draw tile labels
      //  tilebelt.tileToGeoJSON(tile.ref).coordinates;
      const tileCoordinates = tile.toGeoJson().coordinates;
      const topLeft = tileCoordinates[0][0];
      const [x, y] = this.projection.fromLngLat(topLeft as [number, number]);
      const [clipX, clipY] = vec3.transformMat3(vec3.create(), [x, y, 1], matrix);
      const wx = ((1 + clipX) / this.pixelRatio) * canvasWidth;
      const wy = ((1 - clipY) / this.pixelRatio) * canvasHeight;
      const div = document.createElement('div');
      div.className = 'tile-label';
      div.style.left = wx + 8 + 'px';
      div.style.top = wy + 8 + 'px';
      div.appendChild(document.createTextNode(tile.tileId));
      this.overlay.appendChild(div);
    }
  }
}
