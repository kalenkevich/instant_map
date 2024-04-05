import { MapTileRendererType, RenderOptions, SceneCamera } from '../renderer';
import { MapFeatureType } from '../../tile/feature';
import { addExtensionsToContext, ExtendedWebGLRenderingContext } from './webgl_context';
import { ObjectProgram } from './objects/object/object_program';
import { PointProgram } from './objects/point/point_program';
import { PolygonProgram } from './objects/polygon/polygon_program';
import { LineProgram } from './objects/line/line_program';
import { LineShaderProgram } from './objects/line_shader/line_shader_program';
import { TextTextureProgram } from './objects/text_texture/text_texture_program';
import { TextVectorProgram } from './objects/text_vector/text_vector_program';
import { GlyphProgram } from './objects/glyph/glyph_program';
import { ImageProgram } from './objects/image/image_program';
import { FramebufferProgram } from './framebuffer/framebuffer_program';
import { GlyphsManager } from '../../glyphs/glyphs_manager';
import { MapFeatureFlags } from '../../flags';
import { WebGlTexture, createTexture } from './utils/weblg_texture';
import { WebGlFrameBuffer, createFrameBuffer } from './utils/webgl_framebuffer';
import { vector4ToInteger } from './utils/number2vec';
import { FontFormatType } from '../../font/font_config';
import { FontManager } from '../../font/font_manager';
import { WebGlObjectBufferredGroup } from './objects/object/object';

export interface WebGlRendererOptions extends RenderOptions {
  pruneCache?: boolean;
  readPixelRenderMode?: boolean;
}

/**
 * Render object using WebGl API.
 * Knows how to render objects, manage cache, animation and the order of object render.
 */
export class WebGlRenderer {
  private canvas: HTMLCanvasElement;
  private programs: Record<MapFeatureType, ObjectProgram>;
  private gl?: ExtendedWebGLRenderingContext;

  private framebuffer: WebGlFrameBuffer;
  private framebufferProgram: FramebufferProgram;
  private frameBufferTexture: WebGlTexture;

  constructor(
    private readonly rootEl: HTMLElement,
    private readonly featureFlags: MapFeatureFlags,
    private readonly type: MapTileRendererType.webgl | MapTileRendererType.webgl2,
    private readonly devicePixelRatio: number,
    private readonly fontManager: FontManager,
    private readonly textureManager: GlyphsManager,
  ) {
    this.canvas = this.createCanvasEl();
  }

  async init() {
    this.rootEl.appendChild(this.canvas);
    let gl: ExtendedWebGLRenderingContext;

    if (this.type === MapTileRendererType.webgl) {
      gl = this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
      }) as ExtendedWebGLRenderingContext;
      addExtensionsToContext(gl);
    } else {
      gl = this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
      }) as ExtendedWebGLRenderingContext;
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.frameBufferTexture = createTexture(gl, {
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
    this.framebuffer = createFrameBuffer(gl, { texture: this.frameBufferTexture });
    this.framebufferProgram = new FramebufferProgram(gl, this.featureFlags);

    const pointProgram = new PointProgram(gl, this.featureFlags);
    const polygonProgram = new PolygonProgram(gl, this.featureFlags);
    const lineProgram = this.featureFlags.webglRendererUseShaderLines
      ? new LineShaderProgram(gl, this.featureFlags)
      : new LineProgram(gl, this.featureFlags);
    const glyphProgram = new GlyphProgram(gl, this.featureFlags, this.textureManager);
    const textProgram =
      this.featureFlags.webglRendererFontFormatType === FontFormatType.vector
        ? new TextVectorProgram(gl, this.featureFlags)
        : new TextTextureProgram(gl, this.featureFlags, this.fontManager);
    const imageProgram = new ImageProgram(gl, this.featureFlags);

    await Promise.all([
      this.framebufferProgram.init(),
      pointProgram.init(),
      polygonProgram.init(),
      lineProgram.init(),
      glyphProgram.init(),
      textProgram.init(),
      imageProgram.init(),
    ]);

    this.programs = {
      [MapFeatureType.point]: pointProgram,
      [MapFeatureType.line]: lineProgram,
      [MapFeatureType.polygon]: polygonProgram,
      [MapFeatureType.text]: textProgram,
      [MapFeatureType.glyph]: glyphProgram,
      [MapFeatureType.image]: imageProgram,
    };
  }

  destroy() {
    this.rootEl.removeChild(this.canvas);
  }

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
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private currentStateId?: string;
  private alreadyRenderedTileLayer = new Set<string>();
  private getCurrentStateId(camera: SceneCamera) {
    return [...camera.viewMatrix, camera.distance, this.canvas.width, this.canvas.height].join('-');
  }

  getObjectId(objects: WebGlObjectBufferredGroup[], camera: SceneCamera, x: number, y: number): number {
    const gl = this.gl;
    const pixels = new Uint8Array(4);

    this.render(objects, camera, {
      pruneCache: true,
      readPixelRenderMode: true,
    });
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    this.render(objects, camera, {
      pruneCache: true,
      readPixelRenderMode: false,
    });

    return vector4ToInteger([pixels[0], pixels[1], pixels[2], pixels[3]]);
  }

  render(objects: WebGlObjectBufferredGroup[], camera: SceneCamera, options: WebGlRendererOptions) {
    let program: ObjectProgram | undefined;
    let globalUniformsSet = false;
    let shouldRenderToCanvas = false;

    const stateId = this.getCurrentStateId(camera);
    if (options.pruneCache || this.currentStateId !== stateId) {
      this.currentStateId = stateId;
      this.alreadyRenderedTileLayer.clear();
      this.framebuffer.clear();
      this.debugLog('clear');
    }

    const sortedObjects = this.getSortedObjects(objects);

    for (const objectGroup of sortedObjects) {
      if (this.alreadyRenderedTileLayer.has(objectGroup.name)) {
        this.debugLog(`skip layer render "${objectGroup.name}"`);
        continue;
      } else {
        this.alreadyRenderedTileLayer.add(objectGroup.name);
        this.debugLog(`layer render "${objectGroup.name}"`);
      }

      if (!!program && !globalUniformsSet) {
        this.setProgramGlobalUniforms(program, camera, options);
        globalUniformsSet = true;
      }

      const prevProgram: ObjectProgram = program;
      program = this.programs[objectGroup.type];

      this.framebuffer.bind();
      prevProgram?.unlink();
      program.link();
      this.setProgramGlobalUniforms(program, camera, options);
      program.drawObjectGroup(objectGroup, { readPixelRenderMode: options.readPixelRenderMode });
      this.framebuffer.unbind();
      shouldRenderToCanvas = true;
    }

    if (shouldRenderToCanvas) {
      this.framebufferProgram.link();
      this.setProgramGlobalUniforms(this.framebufferProgram, camera, options);
      this.framebufferProgram.draw(this.frameBufferTexture);
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

  private getSortedObjects(objects: WebGlObjectBufferredGroup[]): WebGlObjectBufferredGroup[] {
    return [...objects].sort((g1, g2) => g1.zIndex - g2.zIndex);
  }

  private setProgramGlobalUniforms(program: ObjectProgram, camera: SceneCamera, options: WebGlRendererOptions) {
    program.setMatrix(camera.viewMatrix);
    program.setWidth(this.rootEl.offsetWidth);
    program.setHeight(this.rootEl.offsetHeight);
    program.setReadPixelRenderMode(options.readPixelRenderMode || false);
  }
}
