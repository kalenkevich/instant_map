import { mat3, vec4 } from 'gl-matrix';
import { addExtensionsToContext } from 'twgl.js';
import { Renderer, MapStyles } from '../renderer';
import { MapTileFeatureType } from '../../tile/tile';
import { PbfMapTile, PbfTileLayer } from '../../tile/pbf/pbf_tile';
import { WebGlProgram, ExtendedWebGLRenderingContext } from './programs/program';
import { PolygonProgram } from './programs/polygon_program';
import { LineProgram } from './programs/line_program';

export class WebGlRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private programs: Record<MapTileFeatureType, WebGlProgram>;
  private gl?: ExtendedWebGLRenderingContext;

  constructor(private readonly rootEl: HTMLElement, private devicePixelRatio: number) {
    this.canvas = this.createCanvasEl();
  }

  init() {
    this.rootEl.appendChild(this.canvas);

    const gl = (this.gl = this.canvas.getContext('webgl') as ExtendedWebGLRenderingContext);
    addExtensionsToContext(gl);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const polygonProgram = new PolygonProgram(gl);
    const lineProgram = new LineProgram(gl);
    this.programs = {
      [MapTileFeatureType.point]: polygonProgram,
      [MapTileFeatureType.line]: lineProgram,
      [MapTileFeatureType.polygon]: polygonProgram,
    };
    polygonProgram.init();
    lineProgram.init();
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
    let program;
    let matrixSet = false;

    for (const tile of tiles) {
      const tileLayers = tile.getLayers();

      if (program && !matrixSet) {
        program.setMatrix(matrix);
        matrixSet = true;
      }

      for (const tileLayer of tileLayers) {
        let colorSet = false;
        const { layer, features } = tileLayer as PbfTileLayer;
        const color = styles.layers[layer].map(n => n / 255) as vec4; // RBGA to WebGL

        if (program && !colorSet) {
          program.setColor(color);
          colorSet = true;
        }

        for (const feature of features) {
          const prevProgram: WebGlProgram = program;
          program = this.programs[feature.type];

          if (prevProgram !== program) {
            program.link();
            program.setMatrix(matrix);
            program.setColor(color);
            if (feature.type === MapTileFeatureType.line) {
              (program as LineProgram).setLineWidth(0.0000005);
            }
          }

          const size = 2;
          const normalize = false;
          const stride = 0;
          const offset = 0;

          program.bindBuffer(feature.buffer, size, gl.FLOAT, normalize, stride, offset);
          program.draw(feature.primitiveType, 0, feature.numElements);
        }
      }
    }
  }
}
