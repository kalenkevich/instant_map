import { WebGlSceneCamera } from '../../map/renderer/webgl/webgl_camera';
import { WebGlRenderer, WebGlRendererOptions } from '../../map/renderer/webgl/webgl_renderer';
import { MapFeatureFlags } from '../../map/flags';
import { MapTileRendererType } from '../../map/renderer/renderer';
import { FontManager } from '../../map/font/font_manager';
import { GlyphsManager } from '../../map/glyphs/glyphs_manager';
import { MapFeature } from '../../map/tile/feature';
import { MapFeatures2WebglObjects } from '../../map/renderer/webgl/webgl_map_tile_to_webgl_object';

export class WebGlScene {
  private readonly renderer: WebGlRenderer;
  private readonly fontManager: FontManager;
  private readonly textureManager: GlyphsManager;
  private readonly objects: MapFeature[] = [];
  private width: number;
  private height: number;

  constructor(
    private readonly htmlElement: HTMLElement,
    private readonly featureFlags: MapFeatureFlags,
    private readonly devicePixelRatio: number = window.devicePixelRatio,
  ) {
    this.width = htmlElement.offsetWidth;
    this.height = htmlElement.offsetHeight;
    this.fontManager = new FontManager(featureFlags);
    this.textureManager = new GlyphsManager(featureFlags);

    this.renderer = new WebGlRenderer(
      htmlElement,
      featureFlags,
      MapTileRendererType.webgl2,
      this.devicePixelRatio,
      this.fontManager,
      this.textureManager,
    );
  }

  async init() {
    await Promise.all([this.fontManager.init(), this.textureManager.init()]).then(() => this.renderer.init());
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.renderer.resize(width, height);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  addObject<T extends MapFeature>(obj: T) {
    this.objects.push(obj);
  }

  render(camera: WebGlSceneCamera, renderOptions: WebGlRendererOptions = {}) {
    const objectGroups = MapFeatures2WebglObjects(
      this.objects,
      this.featureFlags,
      this.fontManager,
      this.textureManager,
    );

    this.renderer.render(objectGroups, camera, renderOptions);
  }
}
