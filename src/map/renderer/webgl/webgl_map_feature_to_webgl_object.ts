import { WebGlSceneCamera } from './webgl_camera';
import { FontFormatType } from '../../font/font_config';
import { WebGlObjectBufferredGroup } from './objects/object/object';
import { ImageGroupBuilder } from './objects/image/image_group_builder';
import { PointGroupBuilder } from './objects/point/point_builder';
import { PolygonGroupBuilder } from './objects/polygon/polygon_builder';
import { LineGroupBuilder } from './objects/line/line_builder';
import { GlyphGroupBuilder } from './objects/glyph/glyph_group_builder';
import { TextVectorBuilder } from './objects/text_vector/text_vector_builder';
import { TextTextureGroupBuilder } from './objects/text_texture/text_texture_builder';
import { LineShaiderBuilder } from './objects/line_shader/line_shader_builder';
import {
  MapFeature,
  MapFeatureType,
  PointMapFeature,
  PolygonMapFeature,
  LineMapFeature,
  ImageMapFeature,
  GlyphMapFeature,
  TextMapFeature,
} from '../../tile/feature';
import { MapFeatureFlags } from '../../flags';
import { FontManager } from '../../font/font_manager';
import { GlyphsManager } from '../../glyphs/glyphs_manager';

export function MapFeatures2WebglObjects(
  mapFeatures: MapFeature[],
  camera: WebGlSceneCamera,
  featureFlags: MapFeatureFlags,
  fontManager: FontManager,
  textureManager: GlyphsManager,
  devicePixelRatio: number = window.devicePixelRatio,
): WebGlObjectBufferredGroup[] {
  const pointBuidler = new PointGroupBuilder(featureFlags, devicePixelRatio);
  const polygonGroupBuilder = new PolygonGroupBuilder(featureFlags, devicePixelRatio);
  const lineBuilder = featureFlags.webglRendererUseShaderLines
    ? new LineShaiderBuilder(featureFlags, devicePixelRatio)
    : new LineGroupBuilder(featureFlags, devicePixelRatio);
  const glyphGroupBuilder = new GlyphGroupBuilder(featureFlags, devicePixelRatio, textureManager.getMappingState());
  const textBuilder =
    featureFlags.webglRendererFontFormatType === FontFormatType.vector
      ? new TextVectorBuilder(featureFlags, devicePixelRatio, fontManager)
      : new TextTextureGroupBuilder(featureFlags, devicePixelRatio, fontManager);
  const imageGroupBuilder = new ImageGroupBuilder(featureFlags, devicePixelRatio);

  for (const mapFeature of mapFeatures) {
    switch (mapFeature.type) {
      case MapFeatureType.point: {
        pointBuidler.addObject(mapFeature as PointMapFeature);
        continue;
      }
      case MapFeatureType.polygon: {
        polygonGroupBuilder.addObject(mapFeature as PolygonMapFeature);
        continue;
      }
      case MapFeatureType.line: {
        lineBuilder.addObject(mapFeature as LineMapFeature);
        continue;
      }
      case MapFeatureType.glyph: {
        glyphGroupBuilder.addObject(mapFeature as GlyphMapFeature);
        continue;
      }
      case MapFeatureType.text: {
        textBuilder.addObject(mapFeature as TextMapFeature);
        continue;
      }
      case MapFeatureType.image: {
        imageGroupBuilder.addObject(mapFeature as ImageMapFeature);
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
