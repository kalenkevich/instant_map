import { WebGlObjectBufferredGroup } from './objects/object/object';
import { ImageGroupBuilder } from './objects/image/image_group_builder';
import { PointGroupBuilder } from './objects/point/point_builder';
import { PolygonGroupBuilder } from './objects/polygon/polygon_builder';
import { GlyphGroupBuilder } from './objects/glyph/glyph_group_builder';
import { TextTextureGroupBuilder } from './objects/text_texture/text_texture_builder';
import { LineShaiderBuilder } from './objects/line_shader/line_shader_builder';
import { MapTile } from '../../tile/tile';
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
  featureFlags: MapFeatureFlags,
  fontManager: FontManager,
  textureManager: GlyphsManager,
): WebGlObjectBufferredGroup[] {
  const pointBuidler = new PointGroupBuilder(featureFlags);
  const polygonGroupBuilder = new PolygonGroupBuilder(featureFlags);
  const lineBuilder = new LineShaiderBuilder(featureFlags);
  const glyphGroupBuilder = new GlyphGroupBuilder(featureFlags, textureManager);
  const textBuilder = new TextTextureGroupBuilder(featureFlags, fontManager);
  const imageGroupBuilder = new ImageGroupBuilder(featureFlags);

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
    objectGroups.push(...pointBuidler.build('points'));
  }

  if (!polygonGroupBuilder.isEmpty()) {
    objectGroups.push(...polygonGroupBuilder.build('polygons'));
  }

  if (!lineBuilder.isEmpty()) {
    objectGroups.push(...lineBuilder.build('lines'));
  }

  if (!glyphGroupBuilder.isEmpty()) {
    objectGroups.push(...glyphGroupBuilder.build('glyphs'));
  }

  if (!textBuilder.isEmpty()) {
    objectGroups.push(...textBuilder.build('texts'));
  }

  if (!imageGroupBuilder.isEmpty()) {
    objectGroups.push(...imageGroupBuilder.build('images'));
  }

  return objectGroups;
}

export function MapTile2WebglObjects(
  mapTile: MapTile,
  featureFlags: MapFeatureFlags,
  fontManager: FontManager,
  textureManager: GlyphsManager,
): WebGlObjectBufferredGroup[] {
  if (mapTile.prerendedData && mapTile.prerendedData.length > 0) {
    return mapTile.prerendedData;
  }

  const tileId = mapTile.tileId;
  const objectGroups: WebGlObjectBufferredGroup[] = [];
  const pointBuidler = new PointGroupBuilder(featureFlags);
  const polygonGroupBuilder = new PolygonGroupBuilder(featureFlags);
  const lineBuilder = new LineShaiderBuilder(featureFlags);
  const glyphGroupBuilder = new GlyphGroupBuilder(featureFlags, textureManager);
  const textBuilder = new TextTextureGroupBuilder(featureFlags, fontManager);
  const imageGroupBuilder = new ImageGroupBuilder(featureFlags);

  for (let mapLayerId = 0; mapLayerId < mapTile.layers.length; mapLayerId++) {
    const mapLayer = mapTile.layers[mapLayerId];

    for (let mapFeatureId = 0; mapFeatureId < mapLayer.features.length; mapFeatureId++) {
      const mapFeature = mapLayer.features[mapFeatureId];

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

    if (!pointBuidler.isEmpty()) {
      objectGroups.push(...pointBuidler.build(`${tileId}_${mapLayer.layerName}_points`, mapLayer.zIndex));
      pointBuidler.clear();
    }

    if (!polygonGroupBuilder.isEmpty()) {
      objectGroups.push(...polygonGroupBuilder.build(`${tileId}_${mapLayer.layerName}_polygons`, mapLayer.zIndex));
      polygonGroupBuilder.clear();
    }

    if (!lineBuilder.isEmpty()) {
      objectGroups.push(...lineBuilder.build(`${tileId}_${mapLayer.layerName}_lines`, mapLayer.zIndex));
      lineBuilder.clear();
    }

    if (!glyphGroupBuilder.isEmpty()) {
      objectGroups.push(...glyphGroupBuilder.build(`${tileId}_${mapLayer.layerName}_glyphs`, mapLayer.zIndex));
      glyphGroupBuilder.clear();
    }

    if (!textBuilder.isEmpty()) {
      objectGroups.push(...textBuilder.build(`${tileId}_${mapLayer.layerName}_texts`, mapLayer.zIndex));
      textBuilder.clear();
    }

    if (!imageGroupBuilder.isEmpty()) {
      objectGroups.push(...imageGroupBuilder.build(`${tileId}_${mapLayer.layerName}_images`, mapLayer.zIndex));
      imageGroupBuilder.clear();
    }
  }

  return objectGroups;
}
