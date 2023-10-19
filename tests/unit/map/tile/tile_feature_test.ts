import { Feature, Point } from 'geojson';
import { describe, expect, it } from '@jest/globals';
import { LatLng } from '../../../../src/map/geo/lat_lng';
import { MapState } from '../../../../src/map/map_state';
import { TileFeature } from '../../../../src/map/tile/tile_feature';
import { FeatureStyle, FeatureStyleType } from '../../../../src/map/styles/styles';

describe('TileFeature', () => {
  const mapState: MapState = { zoom: 0, center: new LatLng(0, 0), rotation: 0 };
  const sampleGeojsonFeature: Feature<Point> = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [1, 1],
    },
    properties: {
      name: 'shop 123',
      prop1: 'featureProperty',
    },
  };
  const sampleFeatureStyles: FeatureStyle = {
    type: FeatureStyleType.point,
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

  it('should create TileFeature properly without styles.', () => {
    const tileFeature = new TileFeature({
      feature: sampleGeojsonFeature,
    });

    expect(tileFeature).toBeDefined();
    expect(tileFeature.getStyles()).toBeUndefined();
  });

  it('should create TileFeature properly with styles.', () => {
    const tileFeature = new TileFeature({
      feature: sampleGeojsonFeature,
      styles: sampleFeatureStyles,
    });

    expect(tileFeature).toBeDefined();
    expect(tileFeature.getStyles()).toEqual(sampleFeatureStyles);
  });

  describe('shouldBeRendered', () => {
    it('should return false if style is not defined.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
      });

      expect(tileFeature.shouldBeRendered(mapState)).toBe(false);
    });

    it('should return true if style is defined and show prop is undefined.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: sampleFeatureStyles,
      });

      expect(tileFeature.shouldBeRendered(mapState)).toBe(true);
    });

    it('should return false if style is defined and show prop is false.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: false,
        },
      });

      expect(tileFeature.shouldBeRendered(mapState)).toBe(false);
    });

    it('should return true if style is defined and show prop is a true statement.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
        },
      });

      expect(tileFeature.shouldBeRendered(mapState)).toBe(true);
    });

    it('should return false if style is defined and show prop is a false statement.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'otherPropertyValue'],
        },
      });

      expect(tileFeature.shouldBeRendered(mapState)).toBe(false);
    });

    it('should return false if minzoom is defined and map zoom not in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          minzoom: 10,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 0,
        })
      ).toBe(false);
    });

    it('should return true if minzoom is defined and map zoom in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          minzoom: 0,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 1,
        })
      ).toBe(true);
    });

    it('should return true if maxzoom is defined and map zoom in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          maxzoom: 10,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 5,
        })
      ).toBe(true);
    });

    it('should return false if maxzoom is defined and map zoom not in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          maxzoom: 10,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 15,
        })
      ).toBe(false);
    });

    it('should return true if minzoom and maxzoom is defined and map zoom in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          minzoom: 8,
          maxzoom: 10,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 9,
        })
      ).toBe(true);
      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 8,
        })
      ).toBe(true);
      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 10,
        })
      ).toBe(true);
    });

    it('should return false if minzoom and maxzoom is defined and map zoom not in range.', () => {
      const tileFeature = new TileFeature({
        feature: sampleGeojsonFeature,
        styles: {
          ...sampleFeatureStyles,
          show: ['$eq', ['$get', 'properties.prop1'], 'featureProperty'],
          minzoom: 8,
          maxzoom: 10,
        },
      });

      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 7,
        })
      ).toBe(false);
      expect(
        tileFeature.shouldBeRendered({
          ...mapState,
          zoom: 11,
        })
      ).toBe(false);
    });
  });
});
