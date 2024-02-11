// import { Feature, Point } from 'geojson';
// import { describe, expect, it } from '@jest/globals';
// import { LatLng } from '../../../../src/map/geo/lat_lng';
// import { MapState } from '../../../../src/map/map_state';
// import { TileLayer } from '../../../../src/map/tile/tile_layer';
// import { TileFeature } from '../../../../src/map/tile/tile_feature';
// import { DataLayerStyle, FeatureStyleType } from '../../../../src/map/styles/styles';

// describe('TileLayer', () => {
//   const mapState: MapState = { zoom: 0, center: new LatLng(0, 0), rotation: 0 };
//   const sampleGeojsonFeature: Feature<Point> = {
//     type: 'Feature',
//     geometry: {
//       type: 'Point',
//       coordinates: [1, 1],
//     },
//     properties: {
//       name: 'shop 123',
//     },
//   };
//   const sampleLayerStyles: DataLayerStyle = {
//     sourceLayer: 'land',
//     styleLayerName: 'landStyle',
//     show: true,
//     minzoom: 0,
//     maxzoom: 5,
//     zIndex: 1,
//     feature: {
//       type: FeatureStyleType.point,
//       show: ['$oneOf', ['$get', 'properties.class'], 'land', 'water', 'ice'],
//       color: [
//         '$switch',
//         ['$get', 'properties.class'],
//         ['land', ['$rgb', 1, 1, 1]],
//         ['water', ['$rgb', 1, 1, 2]],
//         ['ice', ['$rgb', 1, 1, 3]],
//       ],
//       radius: 5,
//       border: {
//         type: FeatureStyleType.line,
//         color: ['$rgb', 1, 1, 3],
//         width: ['$switch', ['$get', 'properties.class'], ['land', 1], ['water', 2], ['ice', 3]],
//       },
//       minzoom: 0,
//       maxzoom: 5,
//     },
//   };

//   it('should create TileLayer properly with styles.', () => {
//     const tileLayer = new TileLayer({
//       name: 'layer1',
//       features: [sampleGeojsonFeature],
//       properties: {
//         prop1: 'layerProperty',
//       },
//       styles: sampleLayerStyles,
//     });

//     expect(tileLayer).toBeDefined();
//     expect(tileLayer.getName()).toBe('layer1');
//     expect(tileLayer.getFeatures()).toEqual([
//       new TileFeature({
//         feature: sampleGeojsonFeature,
//         styles: sampleLayerStyles.feature,
//       }),
//     ]);
//     expect(tileLayer.getStyles()).toEqual(sampleLayerStyles);
//   });

//   describe('shouldBeRendered', () => {
//     it('should return true if style is defined and show prop is undefined.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: sampleLayerStyles,
//       });

//       expect(tileLayer.shouldBeRendered(mapState)).toBe(true);
//     });

//     it('should return false if style is defined and show prop is false.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           show: false,
//         },
//       });

//       expect(tileLayer.shouldBeRendered(mapState)).toBe(false);
//     });

//     it('should return true if style is defined and show prop is a true statement.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           show: ['$eq', ['$get', 'properties.prop1'], 'layerProperty'],
//         },
//       });

//       expect(tileLayer.shouldBeRendered(mapState)).toBe(true);
//     });

//     it('should return false if style is defined and show prop is a false statement.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           show: ['$eq', ['$get', 'properties.prop1'], 'otherPropertyValue'],
//         },
//       });

//       expect(tileLayer.shouldBeRendered(mapState)).toBe(false);
//     });

//     it('should return false if minzoom is defined and map zoom not in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           minzoom: 10,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 0,
//         })
//       ).toBe(false);
//     });

//     it('should return true if minzoom is defined and map zoom in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           minzoom: 0,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 1,
//         })
//       ).toBe(true);
//     });

//     it('should return true if maxzoom is defined and map zoom in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           maxzoom: 10,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 5,
//         })
//       ).toBe(true);
//     });

//     it('should return false if maxzoom is defined and map zoom not in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           maxzoom: 10,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 15,
//         })
//       ).toBe(false);
//     });

//     it('should return true if minzoom and maxzoom is defined and map zoom in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           minzoom: 8,
//           maxzoom: 10,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 9,
//         })
//       ).toBe(true);
//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 8,
//         })
//       ).toBe(true);
//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 10,
//         })
//       ).toBe(true);
//     });

//     it('should return false if minzoom and maxzoom is defined and map zoom not in range.', () => {
//       const tileLayer = new TileLayer({
//         name: 'layer1',
//         features: [sampleGeojsonFeature],
//         properties: {
//           prop1: 'layerProperty',
//         },
//         styles: {
//           ...sampleLayerStyles,
//           minzoom: 8,
//           maxzoom: 10,
//         },
//       });

//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 7,
//         })
//       ).toBe(false);
//       expect(
//         tileLayer.shouldBeRendered({
//           ...mapState,
//           zoom: 11,
//         })
//       ).toBe(false);
//     });
//   });
// });
