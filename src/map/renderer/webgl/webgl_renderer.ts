import { mat3 } from 'gl-matrix';
import { addExtensionsToContext } from 'twgl.js';
import { Renderer, RenderOptions } from '../renderer';
import { MapTile, MapTileFeatureType } from '../../tile/tile';
import { MapTileLayer } from '../../tile/tile';
import { PbfTileLayer } from '../../tile/pbf/pbf_tile';
import { ExtendedWebGLRenderingContext } from './webgl_context';
import { ObjectProgram } from './object/object_program';
import { PointProgram } from './point/point_program';
import { PolygonProgram } from './polygon/polygon_program';
import { LineProgram } from './line/line_program';
import { TextTextureProgram } from './text_texture/text_texture_program';
import { TextPolygonProgram } from './text_polygon/text_polygon_program';
import { GlyphProgram } from './glyph/glyph_program';
import { FramebufferProgram } from './framebuffer/framebuffer_program';
import { AtlasTextureManager } from '../../atlas/atlas_manager';
import { MapFeatureFlags } from '../../flags';
import { WebGlTexture, createTexture } from './utils/weblg_texture';
import { WebGlFrameBuffer, createFrameBuffer } from './utils/webgl_framebuffer';
import { vector4ToInteger } from './utils/number2vec';

export class WebGlRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private programs: Record<MapTileFeatureType, ObjectProgram>;
  private gl?: ExtendedWebGLRenderingContext;

  private texture: WebGlTexture;
  private framebuffer: WebGlFrameBuffer;
  private framebufferProgram: FramebufferProgram;

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

    this.texture = createTexture(gl, {
      name: 'framebuffer texture',
      width: this.canvas.width,
      height: this.canvas.height,
      pixels: null,
      unpackPremultiplyAlpha: true,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });
    this.framebuffer = createFrameBuffer(gl, { texture: this.texture });
    this.framebufferProgram = new FramebufferProgram(gl, this.featureFlags);
    this.framebufferProgram.init();

    const pointProgram = new PointProgram(gl, this.featureFlags);
    pointProgram.init();

    const polygonProgram = new PolygonProgram(gl, this.featureFlags);
    polygonProgram.init();

    const lineProgram = new LineProgram(gl, this.featureFlags);
    lineProgram.init();

    const glyphProgram = new GlyphProgram(gl, this.featureFlags, this.textureManager);
    glyphProgram.init();

    const textProgram = this.featureFlags.webglRendererUsePolygonText
      ? new TextPolygonProgram(gl, this.featureFlags)
      : new TextTextureProgram(gl, this.featureFlags);
    textProgram.init();

    this.programs = {
      [MapTileFeatureType.point]: pointProgram,
      [MapTileFeatureType.line]: lineProgram,
      [MapTileFeatureType.polygon]: polygonProgram,
      [MapTileFeatureType.text]: textProgram,
      [MapTileFeatureType.glyph]: glyphProgram,
      // TODO: implement
      [MapTileFeatureType.image]: polygonProgram,
    };
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

  private currentStateId?: string;
  private alreadyRenderedTileLayer = new Set<string>();
  private getCurrentStateId(viewMatrix: mat3, zoom: number, tileSize: number) {
    return [...viewMatrix, zoom, tileSize, this.canvas.width, this.canvas.height].join('-');
  }

  getObjectId(tiles: MapTile[], viewMatrix: mat3, zoom: number, tileSize: number, x: number, y: number): number {
    const gl = this.gl;
    const pixels = new Uint8Array(4);

    this.render(tiles, viewMatrix, zoom, tileSize, {
      pruneCache: true,
      readPixelRenderMode: true,
    });
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    this.render(tiles, viewMatrix, zoom, tileSize, {
      pruneCache: true,
      readPixelRenderMode: false,
    });

    return vector4ToInteger([pixels[0], pixels[1], pixels[2], pixels[3]]);
  }

  render(tiles: MapTile[], viewMatrix: mat3, zoom: number, tileSize: number, options: RenderOptions) {
    let program: ObjectProgram;
    let globalUniformsSet = false;
    let shouldRenderToCanvas = false;

    const stateId = this.getCurrentStateId(viewMatrix, zoom, tileSize);
    if (options.pruneCache || this.currentStateId !== stateId) {
      this.currentStateId = stateId;
      this.alreadyRenderedTileLayer.clear();
      this.framebuffer.clear();
      this.debugLog('clear');
    }

    const sortedLayers = this.getSortedLayers(tiles);

    for (const layer of sortedLayers) {
      const { objectGroups, layerName, tileId } = layer as PbfTileLayer;
      const renderLayerId = `${tileId}-${layerName}`;

      if (this.alreadyRenderedTileLayer.has(renderLayerId)) {
        this.debugLog(`skip layer render "${renderLayerId}"`);
        continue;
      } else {
        this.alreadyRenderedTileLayer.add(renderLayerId);
        this.debugLog(`layer render "${renderLayerId}"`);
      }

      if (program && !globalUniformsSet) {
        this.setProgramGlobalUniforms(program, viewMatrix, zoom, tileSize, options);
        globalUniformsSet = true;
      }

      for (const objectGroup of objectGroups) {
        const prevProgram: ObjectProgram = program;
        program = this.programs[objectGroup.type];

        this.framebuffer.bind();
        prevProgram?.unlink();
        program.link();
        this.setProgramGlobalUniforms(program, viewMatrix, zoom, tileSize, options);
        program.drawObjectGroup(objectGroup, { readPixelRenderMode: options.readPixelRenderMode });
        this.framebuffer.unbind();
        shouldRenderToCanvas = true;
      }
    }

    if (shouldRenderToCanvas) {
      this.framebufferProgram.link();
      this.setProgramGlobalUniforms(this.framebufferProgram, viewMatrix, zoom, tileSize, options);
      this.framebufferProgram.draw(this.texture);
      this.framebufferProgram.unlink();
      this.debugLog(`canvas render`);
    } else {
      this.debugLog(`skip canvas render`);
    }
    this.debugLog('----------------------');
  }

  private debugLog(message: string) {
    if (this.featureFlags.webglRendererDebug) {
      console.log('[WebGl Renderer]: ' + message);
    }
  }

  private getSortedLayers(tiles: MapTile[]): MapTileLayer[] {
    const layers: MapTileLayer[] = [];

    for (const tile of tiles) {
      layers.push(...tile.getLayers());
    }

    return layers.sort((l1, l2) => l1.zIndex - l2.zIndex);
  }

  private setProgramGlobalUniforms(
    program: ObjectProgram,
    viewMatrix: mat3,
    zoom: number,
    tileSize: number,
    options: RenderOptions
  ) {
    program.setMatrix(viewMatrix);
    program.setZoom(zoom);
    program.setTileSize(tileSize);
    program.setWidth(this.rootEl.offsetWidth);
    program.setHeight(this.rootEl.offsetHeight);
    program.setReadPixelRenderMode(options.readPixelRenderMode || false);
  }
}
