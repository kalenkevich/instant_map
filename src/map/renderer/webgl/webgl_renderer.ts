import { mat3 } from 'gl-matrix';
import { addExtensionsToContext } from 'twgl.js';
import { Renderer } from '../renderer';
import { MapTile, MapTileFeatureType } from '../../tile/tile';
import { MapTileLayer } from '../../tile/tile';
import { PbfTileLayer } from '../../tile/pbf/pbf_tile';
import { ObjectProgram, ExtendedWebGLRenderingContext } from './object/object_program';
import { PointProgram } from './point/point_program';
import { PolygonProgram } from './polygon/polygon_program';
import { LineProgram } from './line/line_program';
import { TextProgram } from './text/text_program';
import { GlyphProgram } from './glyph/glyph_program';
import { AtlasTextureManager } from '../../atlas/atlas_manager';
import { MapFeatureFlags } from '../../flags';

export class WebGlRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private programs: Record<MapTileFeatureType, ObjectProgram>;
  private gl?: ExtendedWebGLRenderingContext;

  constructor(
    private readonly rootEl: HTMLElement,
    private readonly featureFlags: MapFeatureFlags,
    private devicePixelRatio: number,
    private textureManager: AtlasTextureManager
  ) {
    this.canvas = this.createCanvasEl();
  }

  init() {
    this.rootEl.appendChild(this.canvas);

    const gl = (this.gl = this.canvas.getContext('webgl', {
      alpha: true,
    }) as ExtendedWebGLRenderingContext);
    addExtensionsToContext(gl);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const pointProgram = new PointProgram(gl, this.featureFlags);
    const polygonProgram = new PolygonProgram(gl, this.featureFlags);
    const lineProgram = new LineProgram(gl, this.featureFlags);
    const textProgram = new TextProgram(gl, this.featureFlags);
    const glyphProgram = new GlyphProgram(gl, this.featureFlags, this.textureManager);
    this.programs = {
      [MapTileFeatureType.point]: pointProgram,
      [MapTileFeatureType.line]: lineProgram,
      [MapTileFeatureType.polygon]: polygonProgram,
      [MapTileFeatureType.text]: textProgram,
      [MapTileFeatureType.glyph]: glyphProgram,
      // TODO: implement
      [MapTileFeatureType.image]: polygonProgram,
    };
    pointProgram.init();
    polygonProgram.init();
    lineProgram.init();
    textProgram.init();
    glyphProgram.init();
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

  render(tiles: MapTile[], viewMatrix: mat3, zoom: number, tileSize: number) {
    let program;
    let globalUniformsSet = false;

    const sortedLayers = this.getSortedLayers(tiles);

    for (const layer of sortedLayers) {
      const { objectGroups } = layer as PbfTileLayer;

      if (program && !globalUniformsSet) {
        this.setProgramGlobalUniforms(program, viewMatrix, zoom, tileSize);
        globalUniformsSet = true;
      }

      for (const objectGroup of objectGroups) {
        const prevProgram: ObjectProgram = program;
        program = this.programs[objectGroup.type];

        if (prevProgram !== program) {
          prevProgram?.unlink();
          program.link();
          this.setProgramGlobalUniforms(program, viewMatrix, zoom, tileSize);
        }

        program.drawObjectGroup(objectGroup);
      }
    }

    this.gl.flush();
  }

  private getSortedLayers(tiles: MapTile[]): MapTileLayer[] {
    const layers: MapTileLayer[] = [];

    for (const tile of tiles) {
      layers.push(...tile.getLayers());
    }

    return layers.sort((l1, l2) => l1.zIndex - l2.zIndex);
  }

  private setProgramGlobalUniforms(program: ObjectProgram, viewMatrix: mat3, zoom: number, tileSize: number) {
    program.setMatrix(viewMatrix);
    program.setZoom(zoom);
    program.setTileSize(tileSize);
    program.setWidth(this.rootEl.offsetWidth);
    program.setHeight(this.rootEl.offsetHeight);
  }
}
