import { WebGlSceneCamera } from '../../map/renderer/webgl/webgl_camera';
import { WebGlRenderer, WebGlRendererOptions } from '../../map/renderer/webgl/webgl_renderer';
import { WebGlObjectBufferredGroup } from '../../map/renderer/webgl/objects/object/object';
import { MapFeatureFlags } from '../../map/flags';
import { MapTileRendererType } from '../../map/renderer/renderer';
import { FontManager } from '../../map/font/font_manager';
import { GlyphsManager } from '../../map/glyphs/glyphs_manager';
import { MapFeatureType } from '../../map/tile/feature';
import { FontFormatType } from '../../map/font/font_config';

import { MapFeature, PointMapFeature, PolygonMapFeature, LineMapFeature, ImageMapFeature, GlyphMapFeature, TextMapFeature } from '../../map/tile/feature';

import { ImageGroupBuilder } from '../../map/renderer/webgl/objects/image/image_group_builder';
import { PointGroupBuilder } from '../../map/renderer/webgl/objects/point/point_builder';
import { PolygonGroupBuilder } from '../../map/renderer/webgl/objects/polygon/polygon_builder';
import { LineGroupBuilder } from '../../map/renderer/webgl/objects/line/line_builder';
import { GlyphGroupBuilder } from '../../map/renderer/webgl/objects/glyph/glyph_group_builder';
import { TextVectorBuilder } from '../../map/renderer/webgl/objects/text_vector/text_vector_builder';
import { TextTextureGroupBuilder } from '../../map/renderer/webgl/objects/text_texture/text_texture_builder';
import { LineShaiderBuilder } from '../../map/renderer/webgl/objects/line_shader/line_shader_builder';

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
    private readonly devicePixelRatio: number = window.devicePixelRatio
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
      this.textureManager
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

  getWebglObjectGroups(camera: WebGlSceneCamera, objects: MapFeature[]): WebGlObjectBufferredGroup[] {
    const pointBuidler = new PointGroupBuilder(this.featureFlags, this.devicePixelRatio);
    const polygonGroupBuilder = new PolygonGroupBuilder(this.featureFlags, this.devicePixelRatio);
    const lineBuilder = this.featureFlags.webglRendererUseShaderLines
      ? new LineShaiderBuilder(this.featureFlags, this.devicePixelRatio)
      : new LineGroupBuilder(this.featureFlags, this.devicePixelRatio);
    const glyphGroupBuilder = new GlyphGroupBuilder(
      this.featureFlags,
      this.devicePixelRatio,
      this.textureManager.getMappingState()
    );
    const textBuilder =
      this.featureFlags.webglRendererFontFormatType === FontFormatType.vector
        ? new TextVectorBuilder(this.featureFlags, this.devicePixelRatio, this.fontManager)
        : new TextTextureGroupBuilder(this.featureFlags, this.devicePixelRatio, this.fontManager);
    const imageGroupBuilder = new ImageGroupBuilder(this.featureFlags, this.devicePixelRatio);

    for (const obj of objects) {
      switch (obj.type) {
        case MapFeatureType.point: {
          pointBuidler.addObject(obj as PointMapFeature);
          continue;
        }
        case MapFeatureType.polygon: {
          polygonGroupBuilder.addObject(obj as PolygonMapFeature);
          continue;
        }
        case MapFeatureType.line: {
          lineBuilder.addObject(obj as LineMapFeature);
          continue;
        }
        case MapFeatureType.glyph: {
          glyphGroupBuilder.addObject(obj as GlyphMapFeature);
          continue;
        }
        case MapFeatureType.text: {
          textBuilder.addObject(obj as TextMapFeature);
          continue;
        }
        case MapFeatureType.image: {
          imageGroupBuilder.addObject(obj as ImageMapFeature);
          continue;
        }
      }
    }

    const objectGroups: WebGlObjectBufferredGroup[] = [];

    if (!pointBuidler.isEmpty()) {
      objectGroups.push(pointBuidler.build(camera, 'points'));
    }

    if (!polygonGroupBuilder.isEmpty()) {
      objectGroups.push(polygonGroupBuilder.build(camera, 'polygons'));
    }

    if (!lineBuilder.isEmpty()) {
      objectGroups.push(lineBuilder.build(camera, 'lines'));
    }

    if (!glyphGroupBuilder.isEmpty()) {
      objectGroups.push(glyphGroupBuilder.build(camera, 'glyphs'));
    }

    if (!textBuilder.isEmpty()) {
      objectGroups.push(textBuilder.build(camera, 'texts'));
    }

    if (!imageGroupBuilder.isEmpty()) {
      objectGroups.push(imageGroupBuilder.build(camera, 'images'));
    }

    return objectGroups;
  }

  addObject<T extends MapFeature>(obj: T) {
    this.objects.push(obj);
  }

  render(camera: WebGlSceneCamera, renderOptions: WebGlRendererOptions = {}) {
    const objectGroups = this.getWebglObjectGroups(camera, this.objects);

    this.renderer.render(objectGroups, camera, renderOptions);
  }
}
