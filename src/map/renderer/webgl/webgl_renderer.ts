import { MapTileRendererType, RenderOptions, SceneCamera } from '../renderer';
import { MapFeatureType } from '../../tile/feature';
import { MapFeatureFlags } from '../../flags';
import { FontManager } from '../../font/font_manager';

import { addExtensionsToContext, ExtendedWebGLRenderingContext } from './webgl_context';
import { ObjectProgram } from './objects/object/object_program';
import { WebGlObjectBufferredGroup } from './objects/object/object';
import { PointProgram } from './objects/point/point_program';
import { PolygonProgram } from './objects/polygon/polygon_program';
import { LineShaderProgram } from './objects/line_shader/line_shader_program';
import { TextTextureProgram } from './objects/text_texture/text_texture_program';
import { GlyphProgram } from './objects/glyph/glyph_program';
import { ImageProgram } from './objects/image/image_program';
import { FramebufferProgram } from './framebuffer/framebuffer_program';
import { GlyphsManager } from '../../glyphs/glyphs_manager';
import { createWebGlTexture, resetTextureIndex } from './helpers/weblg_texture';
import { WebGlFrameBuffer, createFrameBuffer } from './helpers/webgl_framebuffer';
import { vector4ToInteger } from './utils/number2vec';
import { getProjectionViewMatrix3 } from './utils/webgl_camera_utils';

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

  private framebuffer?: WebGlFrameBuffer;
  private framebufferProgram: FramebufferProgram;

  constructor(
    private readonly rootEl: HTMLElement,
    private readonly featureFlags: MapFeatureFlags,
    private readonly type: MapTileRendererType.webgl | MapTileRendererType.webgl2,
    private readonly devicePixelRatio: number,
    private readonly fontManager: FontManager,
    private readonly textureManager: GlyphsManager,
  ) {
    this.canvas = createCanvasEl(this.rootEl, devicePixelRatio);
  }

  async init() {
    this.rootEl.appendChild(this.canvas);
    let gl: ExtendedWebGLRenderingContext;

    if (this.type === MapTileRendererType.webgl) {
      gl = this.gl = this.canvas.getContext('webgl', {
        performance: 'high-performance',
        alpha: true,
        antialias: true,
      }) as ExtendedWebGLRenderingContext;
      addExtensionsToContext(gl);
    } else {
      gl = this.gl = this.canvas.getContext('webgl2', {
        performance: 'high-performance',
        alpha: true,
        antialias: true,
      }) as ExtendedWebGLRenderingContext;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.framebuffer = this.createFramebuffer();
    this.framebufferProgram = new FramebufferProgram(gl, this.featureFlags);
    const pointProgram = new PointProgram(gl, this.featureFlags);
    const polygonProgram = new PolygonProgram(gl, this.featureFlags);
    const lineProgram = new LineShaderProgram(gl, this.featureFlags);
    const glyphProgram = new GlyphProgram(gl, this.featureFlags, this.textureManager);
    const textProgram = new TextTextureProgram(gl, this.featureFlags, this.fontManager);
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
    resetTextureIndex();
    this.rootEl.removeChild(this.canvas);
  }

  public resize(width: number, height: number) {
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    // we should recreate framebuffer object
    this.alreadyRenderedTileLayer.clear();
    this.framebuffer?.clear();
    this.framebuffer = this.createFramebuffer();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private currentStateId?: string;
  private alreadyRenderedTileLayer = new Set<string>();
  private getCurrentStateId(camera: SceneCamera) {
    return [
      camera.x,
      camera.y,
      camera.width,
      camera.height,
      camera.fieldOfView,
      camera.zFar,
      camera.zNear,
      camera.xRotation,
      camera.yRotation,
      camera.zRotation,
      camera.distance,
    ].join('-');
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
      this.framebuffer?.clear();
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
      this.framebufferProgram.draw(this.framebuffer.getTexture());
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
    program.setMatrix(getProjectionViewMatrix3(camera));
    program.setWidth(this.canvas.width);
    program.setHeight(this.canvas.height);
    program.setDistance(camera.distance);
    program.setDevicePixelRation(this.devicePixelRatio);
    program.setReadPixelRenderMode(options.readPixelRenderMode || false);
  }

  private createFramebuffer(): WebGlFrameBuffer {
    const gl = this.gl;

    const frameBufferTexture = createWebGlTexture(gl, {
      name: 'framebuffer_texture',
      // Replace framebuffer with a new instance but use the same texture index
      textureIndex: this.framebuffer?.getTexture().index,
      width: this.canvas.width,
      height: this.canvas.height,
      pixels: null,
      unpackPremultiplyAlpha: true,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });

    return createFrameBuffer(gl, { texture: frameBufferTexture });
  }
}

export function createCanvasEl(rootEl: HTMLElement, devicePixelRatio: number = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = rootEl.offsetWidth;
  const height = rootEl.offsetHeight;

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `100%`;
  canvas.style.height = `100%`;
  canvas.style.background = 'transparent';

  return canvas;
}
