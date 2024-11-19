import { WebGlObjectBufferredGroup } from './objects/object/object';
import { getPointFeatureGroups } from './objects/point/point_builder';
import { getPolygonFeatureGroups } from './objects/polygon/polygon_builder';
import { getLineFeatureGroups } from './objects/line_shader/line_shader_builder';
import { getGlyphFeatureGroups } from './objects/glyph/glyph_group_builder';
import { getTextFeatureGroups } from './objects/text_texture/text_texture_builder';
import { getImageFeatureGroups } from './objects/image/image_group_builder';
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
  glyphsManager: GlyphsManager,
  devicePixelRatio: number = 1,
): WebGlObjectBufferredGroup[] {
  const points: PointMapFeature[] = [];
  const polygons: PolygonMapFeature[] = [];
  const lines: LineMapFeature[] = [];
  const glyphs: GlyphMapFeature[] = [];
  const texts: TextMapFeature[] = [];
  const images: ImageMapFeature[] = [];
  const visibleMapFeatures = mapFeatures.filter(f => f.visible);

  for (const mapFeature of visibleMapFeatures) {
    switch (mapFeature.type) {
      case MapFeatureType.point: {
        points.push(mapFeature as PointMapFeature);
        continue;
      }
      case MapFeatureType.polygon: {
        polygons.push(mapFeature as PolygonMapFeature);
        continue;
      }
      case MapFeatureType.line: {
        lines.push(mapFeature as LineMapFeature);
        continue;
      }
      case MapFeatureType.glyph: {
        glyphs.push(mapFeature as GlyphMapFeature);
        continue;
      }
      case MapFeatureType.text: {
        if (mapFeature.text) {
          texts.push(mapFeature as TextMapFeature);
        }
        continue;
      }
      case MapFeatureType.image: {
        images.push(mapFeature as ImageMapFeature);
        continue;
      }
    }
  }

  const objectGroups: WebGlObjectBufferredGroup[] = [];

  if (points.length) {
    objectGroups.push(...getPointFeatureGroups(points, 'points', 0, { featureFlags, devicePixelRatio }));
  }

  if (polygons.length) {
    objectGroups.push(...getPolygonFeatureGroups(polygons, 'polygons', 0, { featureFlags, devicePixelRatio }));
  }

  if (lines.length) {
    objectGroups.push(...getLineFeatureGroups(lines, 'lines', 0, { featureFlags, devicePixelRatio }));
  }

  if (glyphs.length) {
    objectGroups.push(...getGlyphFeatureGroups(glyphs, 'glyphs', 0, { featureFlags, devicePixelRatio, glyphsManager }));
  }

  if (texts.length) {
    objectGroups.push(...getTextFeatureGroups(texts, 'texts', 0, { featureFlags, devicePixelRatio, fontManager }));
  }

  if (images.length) {
    objectGroups.push(...getImageFeatureGroups(images, 'images', 0, { featureFlags, devicePixelRatio }));
  }

  return objectGroups;
}

export function MapTile2WebglObjects(
  mapTile: MapTile,
  featureFlags: MapFeatureFlags,
  fontManager: FontManager,
  glyphsManager: GlyphsManager,
  devicePixelRatio: number,
): WebGlObjectBufferredGroup[] {
  if (mapTile.prerendedData && mapTile.prerendedData.length > 0) {
    return mapTile.prerendedData;
  }

  const tileId = mapTile.tileId;
  const objectGroups: WebGlObjectBufferredGroup[] = [];
  let points: PointMapFeature[] = [];
  let polygons: PolygonMapFeature[] = [];
  let lines: LineMapFeature[] = [];
  let glyphs: GlyphMapFeature[] = [];
  let texts: TextMapFeature[] = [];
  let images: ImageMapFeature[] = [];

  for (let mapLayerId = 0; mapLayerId < mapTile.layers.length; mapLayerId++) {
    const mapLayer = mapTile.layers[mapLayerId];

    for (let mapFeatureId = 0; mapFeatureId < mapLayer.features.length; mapFeatureId++) {
      const mapFeature = mapLayer.features[mapFeatureId];
      if (!mapFeature.visible) {
        continue;
      }

      switch (mapFeature.type) {
        case MapFeatureType.point: {
          points.push(mapFeature as PointMapFeature);
          continue;
        }
        case MapFeatureType.polygon: {
          polygons.push(mapFeature as PolygonMapFeature);
          continue;
        }
        case MapFeatureType.line: {
          lines.push(mapFeature as LineMapFeature);
          continue;
        }
        case MapFeatureType.glyph: {
          glyphs.push(mapFeature as GlyphMapFeature);
          continue;
        }
        case MapFeatureType.text: {
          if (mapFeature.text) {
            texts.push(mapFeature as TextMapFeature);
          }
          continue;
        }
        case MapFeatureType.image: {
          images.push(mapFeature as ImageMapFeature);
          continue;
        }
      }
    }

    if (points.length) {
      objectGroups.push(
        ...getPointFeatureGroups(points, `${tileId}_${mapLayer.layerName}_points`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
        }),
      );
      points = [];
    }

    if (polygons.length) {
      objectGroups.push(
        ...getPolygonFeatureGroups(polygons, `${tileId}_${mapLayer.layerName}_polygons`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
        }),
      );
      polygons = [];
    }

    if (lines.length) {
      objectGroups.push(
        ...getLineFeatureGroups(lines, `${tileId}_${mapLayer.layerName}_lines`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
        }),
      );
      lines = [];
    }

    if (glyphs.length) {
      objectGroups.push(
        ...getGlyphFeatureGroups(glyphs, `${tileId}_${mapLayer.layerName}_glyphs`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
          glyphsManager,
        }),
      );
      glyphs = [];
    }

    if (texts.length) {
      objectGroups.push(
        ...getTextFeatureGroups(texts, `${tileId}_${mapLayer.layerName}_texts`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
          fontManager,
        }),
      );
      texts = [];
    }

    if (images.length) {
      objectGroups.push(
        ...getImageFeatureGroups(images, `${tileId}_${mapLayer.layerName}_images`, mapLayer.zIndex, {
          featureFlags,
          devicePixelRatio,
        }),
      );
      images = [];
    }
  }

  return objectGroups;
}
