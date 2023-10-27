import { describe, expect, it } from '@jest/globals';
import {
  DataLayerStyle,
  FeatureStyleType,
  PointStyle,
  LineStyle,
  PolygonStyle,
  TextStyle,
  ImageStyle,
  BackgroundStyle,
} from '../../../../src/map/styles/styles';
import { compileLayerStyle, compileFeatureStyle, isFeatureStyle } from '../../../../src/map/styles/styles_utils';

describe('compileLayerStyle', () => {
  it('should return compile data layer styles', () => {
    const style: DataLayerStyle = {
      sourceLayer: 'land',
      styleLayerName: 'landStyle',
      zIndex: 1,
      show: true,
      minzoom: 0,
      maxzoom: 5,
      feature: {
        type: FeatureStyleType.polygon,
        show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['land', ['$rgb', 1, 1, 1]],
          ['water', ['$rgb', 1, 1, 2]],
          ['ice', ['$rgb', 1, 1, 3]],
        ],
        border: {
          type: FeatureStyleType.line,
          color: ['$rgb', 1, 1, 3],
          width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
        },
        minzoom: 0,
        maxzoom: 5,
      },
      background: {
        type: FeatureStyleType.background,
        color: [
          '$switch',
          ['$get', 'properties.layerClass'],
          ['empty', ['$rgb', 1, 1, 1]],
          ['cover', ['$rgb', 1, 1, 2]],
        ],
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
        type: FeatureStyleType.polygon,
        show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['land', ['$rgb', 1, 1, 1]],
          ['water', ['$rgb', 1, 1, 2]],
          ['ice', ['$rgb', 1, 1, 3]],
        ],
        border: {
          type: FeatureStyleType.line,
          color: ['$rgb', 1, 1, 3],
          width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
        },
        minzoom: 0,
        maxzoom: 5,
      },
      background: {
        type: FeatureStyleType.background,
        color: ['$rgb', 1, 1, 2],
        minzoom: 0,
        maxzoom: 5,
      },
    });
  });
});

describe('compileFeatureStyle', () => {
  it('should return compiled feature style for Point', () => {
    const featureStyle: PointStyle = {
      type: FeatureStyleType.point,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      radius: 5,
      border: {
        type: FeatureStyleType.line,
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
      type: FeatureStyleType.point,
      show: true,
      color: ['$rgb', 1, 1, 2],
      radius: 5,
      border: {
        type: FeatureStyleType.line,
        color: ['$rgb', 1, 1, 3],
        width: 2,
      },
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Line', () => {
    const featureStyle: LineStyle = {
      type: FeatureStyleType.line,
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
      type: FeatureStyleType.line,
      show: true,
      color: ['$rgb', 1, 1, 2],
      width: 2,
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Polygon', () => {
    const featureStyle: PolygonStyle = {
      type: FeatureStyleType.polygon,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      border: {
        type: FeatureStyleType.line,
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
      type: FeatureStyleType.polygon,
      show: true,
      color: ['$rgb', 1, 1, 2],
      border: {
        type: FeatureStyleType.line,
        color: ['$rgb', 1, 1, 3],
        width: 2,
      },
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Text', () => {
    const featureStyle: TextStyle = {
      type: FeatureStyleType.text,
      text: ['$get', 'properties.label'],
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
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
      type: FeatureStyleType.text,
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
    const featureStyle: ImageStyle = {
      type: FeatureStyleType.image,
      name: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', 'landImage'],
        ['water', 'waterImage'],
        ['ice', 'iceImage'],
      ],
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
      type: FeatureStyleType.image,
      name: 'waterImage',
      show: true,
      width: 256,
      height: 256,
      minzoom: 0,
      maxzoom: 5,
    });
  });

  it('should return compiled feature style for Background', () => {
    const featureStyle: BackgroundStyle = {
      type: FeatureStyleType.background,
      show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['land', ['$rgb', 1, 1, 1]],
        ['water', ['$rgb', 1, 1, 2]],
        ['ice', ['$rgb', 1, 1, 3]],
      ],
      minzoom: 0,
      maxzoom: 5,
    };

    const compiled = compileFeatureStyle(featureStyle, {
      properties: {
        class: 'water',
      },
    });

    expect(compiled).toEqual({
      type: FeatureStyleType.background,
      show: true,
      color: ['$rgb', 1, 1, 2],
      minzoom: 0,
      maxzoom: 5,
    });
  });
});

describe('isFeatureStyle', () => {
  it('should recognise FeatureStyle by type', () => {
    expect(isFeatureStyle({ type: FeatureStyleType.point })).toBe(true);
    expect(isFeatureStyle({ type: FeatureStyleType.line })).toBe(true);
    expect(isFeatureStyle({ type: FeatureStyleType.polygon })).toBe(true);
    expect(isFeatureStyle({ type: FeatureStyleType.text })).toBe(true);
    expect(isFeatureStyle({ type: FeatureStyleType.image })).toBe(true);
    expect(isFeatureStyle({ type: FeatureStyleType.background })).toBe(true);

    expect(isFeatureStyle({ type: 'unknown' })).toBe(false);
    expect(isFeatureStyle({})).toBe(false);
    expect(isFeatureStyle(null)).toBe(false);
    expect(isFeatureStyle(undefined)).toBe(false);
  });
});
