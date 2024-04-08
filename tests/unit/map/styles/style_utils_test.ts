import { describe, expect, it } from '@jest/globals';
import {
  DataLayerStyle,
  PointStyle,
  LineStyle,
  PolygonStyle,
  TextStyle,
  GlyphStyle,
} from '../../../../src/map/styles/styles';

import { MapFeatureType } from '../../../../src/map/tile/feature';
import { compileLayerStyle, compileFeatureStyle, isFeatureStyle } from '../../../../src/map/styles/styles_utils';

describe('compileLayerStyle', () => {
  it('should return compile data layer styles', () => {
    const style: DataLayerStyle = {
      source: 'source',
      sourceLayer: 'land',
      styleLayerName: 'landStyle',
      zIndex: 1,
      show: true,
      minzoom: 0,
      maxzoom: 5,
      feature: {
        type: MapFeatureType.polygon,
        show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['land', ['$rgb', 1, 1, 1]],
          ['water', ['$rgb', 1, 1, 2]],
          ['ice', ['$rgb', 1, 1, 3]],
        ],
        border: {
          type: MapFeatureType.line,
          color: ['$rgb', 1, 1, 3],
          width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
        },
        minzoom: 0,
        maxzoom: 5,
      },
    };

    const compiled = compileLayerStyle(style, {
      properties: {
        layerClass: 'cover',
      },
    });

    expect(compiled).toEqual({
      sourceLayer: 'land',
      styleLayerName: 'landStyle',
      show: true,
      zIndex: 1,
      minzoom: 0,
      maxzoom: 5,
      feature: {
        type: MapFeatureType.polygon,
        show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['land', ['$rgb', 1, 1, 1]],
          ['water', ['$rgb', 1, 1, 2]],
          ['ice', ['$rgb', 1, 1, 3]],
        ],
        border: {
          type: MapFeatureType.line,
          color: ['$rgb', 1, 1, 3],
          width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
        },
        minzoom: 0,
        maxzoom: 5,
      },
    });
  });
});

describe('compileFeatureStyle', () => {
  it('should return compiled feature style for Point', () => {
    const featureStyle: PointStyle = {
      type: MapFeatureType.point,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      radius: 5,
      borderColor: ['$rgb', 1, 1, 3],
      borderWidth: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
      },
    });

    expect(compiled).toEqual({
      type: MapFeatureType.point,
      show: true,
      color: ['$rgb', 1, 1, 2],
      radius: 5,
      border: {
        type: MapFeatureType.line,
        color: ['$rgb', 1, 1, 3],
        width: 2,
      },
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Line', () => {
    const featureStyle: LineStyle = {
      type: MapFeatureType.line,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
      },
    });

    expect(compiled).toEqual({
      type: MapFeatureType.line,
      show: true,
      color: ['$rgb', 1, 1, 2],
      width: 2,
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Polygon', () => {
    const featureStyle: PolygonStyle = {
      type: MapFeatureType.polygon,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      border: {
        type: MapFeatureType.line,
        color: ['$rgb', 1, 1, 3],
        width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
      },
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
      },
    });

    expect(compiled).toEqual({
      type: MapFeatureType.polygon,
      show: true,
      color: ['$rgb', 1, 1, 2],
      border: {
        type: MapFeatureType.line,
        color: ['$rgb', 1, 1, 3],
        width: 2,
      },
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Text', () => {
    const featureStyle: TextStyle = {
      type: MapFeatureType.text,
      text: ['$get', 'properties.label'],
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      borderColor: ['$rgba', 0, 0, 0, 1],
      font: 'Arial',
      fontSize: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
        label: 'Shchara',
      },
    });

    expect(compiled).toEqual({
      type: MapFeatureType.text,
      show: true,
      text: 'Shchara',
      color: ['$rgb', 1, 1, 2],
      font: 'Arial',
      fontSize: 2,
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Image', () => {
    const featureStyle: GlyphStyle = {
      type: MapFeatureType.glyph,
      name: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', 'landImage'],
        ['water', 'waterImage'],
        ['ice', 'iceImage'],
      ],
      atlas: 'some-atlas',
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      width: 256,
      height: 256,
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
      },
    });

    expect(compiled).toEqual({
      type: MapFeatureType.glyph,
      name: 'waterImage',
      show: true,
      width: 256,
      height: 256,
      minzoom: 0,
      maxzoom: 5,
    });
  });
});

describe('isFeatureStyle', () => {
  it('should recognise FeatureStyle by type', () => {
    expect(isFeatureStyle({ type: MapFeatureType.point })).toBe(true);
    expect(isFeatureStyle({ type: MapFeatureType.line })).toBe(true);
    expect(isFeatureStyle({ type: MapFeatureType.polygon })).toBe(true);
    expect(isFeatureStyle({ type: MapFeatureType.text })).toBe(true);
    expect(isFeatureStyle({ type: MapFeatureType.image })).toBe(true);
    // expect(isFeatureStyle({ type: MapTileFeatureType.background })).toBe(true);

    expect(isFeatureStyle({ type: 'unknown' })).toBe(false);
    expect(isFeatureStyle({})).toBe(false);
    expect(isFeatureStyle(null)).toBe(false);
    expect(isFeatureStyle(undefined)).toBe(false);
  });
});
