// import Protobuf from 'pbf';
// import { VectorTile } from '@mapbox/vector-tile';
// import geometryCenter from '@turf/center';
// import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point, MultiPoint } from 'geojson';
// // Common
// import { FontManager } from '../../../font/font_manager';
// import { FontFormatType } from '../../../font/font_config';
// import { MercatorProjection } from '../../../geo/projection/mercator_projection';
// // Tile
// import { MapFeatureType, LineJoinStyle, LineFillStyle } from '../../../tile/feature';
// import { FetchTileOptions } from '../../../tile/tile_source/tile_source_processor';
// import { WebGlMapLayer } from './webgl_tile';
// // Styles
// import {
//   DataLayerStyle,
//   MvtTileSource,
//   GlyphStyle,
//   LineStyle,
//   PointStyle,
//   PolygonStyle,
//   TextStyle,
// } from '../../../styles/styles';
// import { compileStatement } from '../../../styles/style_statement_utils';
// // WebGl objects
// import { SceneCamera } from '../../renderer';
// import { WebGlObjectBufferredGroup } from '../objects/object/object';
// import { PointGroupBuilder } from '../objects/point/point_builder';
// import { PolygonGroupBuilder } from '../objects/polygon/polygon_builder';
// import { LineGroupBuilder } from '../objects/line/line_builder';
// import { GlyphGroupBuilder } from '../objects/glyph/glyph_group_builder';
// import { TextVectorBuilder } from '../objects/text_vector/text_vector_builder';
// import { TextTextureGroupBuilder } from '../objects/text_texture/text_texture_builder';
// import { LineShaiderBuilder } from '../objects/line_shader/line_shader_builder';

// export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point | MultiPoint;

// function getMapTileFeatureType(feature: Feature<SupportedGeometry>): MapFeatureType {
//   const type = feature.geometry.type;

//   if (type === 'Polygon' || type === 'MultiPolygon') {
//     return MapFeatureType.polygon;
//   }

//   if (type === 'Point' || type === 'MultiPoint') {
//     return MapFeatureType.point;
//   }

//   if (type === 'LineString' || type === 'MultiLineString') {
//     return MapFeatureType.line;
//   }

//   console.log('Unknown feature type', type);

//   return MapFeatureType.polygon;
// }

// export async function MvtTile2WebglLayers(
//   tileURL: string,
//   source: MvtTileSource,
//   sourceLayers: DataLayerStyle[],
//   {
//     tileId,
//     canvasWidth,
//     canvasHeight,
//     pixelRatio,
//     zoom,
//     tileSize,
//     atlasTextureMappingState,
//     fontManagerState,
//     projectionViewMat,
//     featureFlags,
//   }: FetchTileOptions,
//   abortController: AbortController,
// ): Promise<WebGlMapLayer[]> {
//   const [x, y, z] = tileId.split('/').map(Number);
//   const projection = new MercatorProjection();
//   const camera: SceneCamera = {
//     width: canvasWidth,
//     height: canvasHeight,
//     distance: Math.pow(2, zoom) * tileSize,
//     viewMatrix: projectionViewMat,
//   };
//   const fontManager = new FontManager(featureFlags, {}, fontManagerState);
//   const tileLayers: WebGlMapLayer[] = [];

//   const resData = await fetch(tileURL, { signal: abortController.signal }).then(data => data.arrayBuffer());
//   const pbf = new Protobuf(resData);
//   const vectorTile = new VectorTile(pbf);

//   for (const styleLayer of sourceLayers) {
//     if (styleLayer.show === false || !vectorTile?.layers?.[styleLayer.sourceLayer]) {
//       continue;
//     }

//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     const numFeatures = vectorTile.layers[styleLayer.sourceLayer]?._features?.length || 0;

//     const objectGroups: WebGlObjectBufferredGroup[] = [];
//     const pointsGroupBuilder = new PointGroupBuilder(featureFlags, pixelRatio);
//     const polygonGroupBuilder = new PolygonGroupBuilder(featureFlags, pixelRatio);

//     const lineGroupBuilder = featureFlags.webglRendererUseShaderLines
//       ? new LineShaiderBuilder(featureFlags, pixelRatio)
//       : new LineGroupBuilder(featureFlags, pixelRatio);
//     const glyphGroupBuilder = new GlyphGroupBuilder(featureFlags, pixelRatio, atlasTextureMappingState);

//     const textTextureGroupBuilder =
//       featureFlags.webglRendererFontFormatType === FontFormatType.vector
//         ? new TextVectorBuilder(featureFlags, pixelRatio, fontManager)
//         : new TextTextureGroupBuilder(featureFlags, pixelRatio, fontManager);

//     for (let i = 0; i < numFeatures; i++) {
//       const geojson: Feature<SupportedGeometry> = vectorTile.layers[styleLayer.sourceLayer]
//         .feature(i)
//         .toGeoJSON(x, y, z) as Feature<SupportedGeometry>;

//       const featureType = getMapTileFeatureType(geojson);
//       const possibleText = styleLayer.feature.type === MapFeatureType.text && featureType === MapFeatureType.point;
//       const possibleGlyph = styleLayer.feature.type === MapFeatureType.glyph;
//       const isTextOrGlyph = [MapFeatureType.glyph, MapFeatureType.text].includes(styleLayer.feature.type);

//       if (featureType !== styleLayer.feature.type && !possibleText && !possibleGlyph) {
//         continue;
//       }

//       const showFeature =
//         styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, geojson) : true;
//       if (!showFeature) {
//         continue;
//       }

//       if (featureType === MapFeatureType.point && !isTextOrGlyph) {
//         const pointStyle = styleLayer.feature as PointStyle;

//         if (geojson.geometry.type === 'Point') {
//           const pointFeature = geojson as Feature<Point>;

//           pointsGroupBuilder.addObject({
//             id: pointFeature.id! as number,
//             type: MapFeatureType.point,
//             color: compileStatement(pointStyle.color, pointFeature),
//             center: projection.fromLngLat(pointFeature.geometry.coordinates as [number, number]),
//             radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
//             components: 32,
//             borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
//             borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
//             margin: {
//               top: pointStyle.margin?.top ? compileStatement(pointStyle.margin?.top, pointFeature) : 0,
//               left: pointStyle.margin?.left ? compileStatement(pointStyle.margin?.left, pointFeature) : 0,
//             },
//           });

//           continue;
//         }

//         if (geojson.geometry.type === 'MultiPoint') {
//           const pointFeature = geojson as Feature<MultiPoint>;

//           for (const point of geojson.geometry.coordinates) {
//             pointsGroupBuilder.addObject({
//               id: pointFeature.id! as number,
//               type: MapFeatureType.point,
//               color: compileStatement(pointStyle.color, pointFeature),
//               center: projection.fromLngLat(point as [number, number]),
//               radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
//               components: 32,
//               borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
//               borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
//               margin: {
//                 top: pointStyle.margin?.top ? compileStatement(pointStyle.margin?.top, pointFeature) : 0,
//                 left: pointStyle.margin?.left ? compileStatement(pointStyle.margin?.left, pointFeature) : 0,
//               },
//             });
//           }
//         }

//         continue;
//       }

//       if (featureType === MapFeatureType.point && styleLayer.feature.type === MapFeatureType.text) {
//         const textStyle = styleLayer.feature as TextStyle;

//         if (geojson.geometry.type === 'Point') {
//           const pointFeature = geojson as Feature<Point>;

//           textTextureGroupBuilder.addObject({
//             id: pointFeature.id! as number,
//             type: MapFeatureType.text,
//             color: compileStatement(textStyle.color, pointFeature),
//             borderColor: compileStatement(textStyle.borderColor, pointFeature),
//             text: compileStatement(textStyle.text, pointFeature),
//             center: projection.fromLngLat(pointFeature.geometry.coordinates as [number, number]),
//             font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensans',
//             fontSize: compileStatement(textStyle.fontSize, pointFeature),
//             borderWidth: 1,
//             margin: {
//               top: textStyle.margin?.top ? compileStatement(textStyle.margin?.top, pointFeature) : 0,
//               left: textStyle.margin?.left ? compileStatement(textStyle.margin?.left, pointFeature) : 0,
//             },
//           });

//           continue;
//         }

//         if (geojson.geometry.type === 'MultiPoint') {
//           const pointFeature = geojson as Feature<MultiPoint>;

//           for (const point of geojson.geometry.coordinates) {
//             textTextureGroupBuilder.addObject({
//               id: pointFeature.id! as number,
//               type: MapFeatureType.text,
//               color: compileStatement(textStyle.color, pointFeature),
//               borderColor: compileStatement(textStyle.borderColor, pointFeature),
//               text: compileStatement(textStyle.text, pointFeature),
//               center: projection.fromLngLat(point as [number, number]),
//               font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensans',
//               fontSize: compileStatement(textStyle.fontSize, pointFeature),
//               borderWidth: 1,
//               margin: {
//                 top: textStyle.margin?.top ? compileStatement(textStyle.margin?.top, pointFeature) : 0,
//                 left: textStyle.margin?.left ? compileStatement(textStyle.margin?.left, pointFeature) : 0,
//               },
//             });
//           }
//         }

//         continue;
//       }

//       if (featureType === MapFeatureType.point && styleLayer.feature.type === MapFeatureType.glyph) {
//         let center: [number, number];

//         if (geojson.geometry.type === 'Point') {
//           center = geojson.geometry.coordinates as [number, number];
//         } else {
//           center = geometryCenter(geojson).geometry.coordinates as [number, number];
//         }

//         const pointFeature = geojson as Feature<Point>;
//         const glyphStyle = styleLayer.feature as GlyphStyle;

//         glyphGroupBuilder.addObject({
//           id: pointFeature.id! as number,
//           type: MapFeatureType.glyph,
//           atlas: compileStatement(glyphStyle.atlas, pointFeature),
//           name: compileStatement(glyphStyle.name, pointFeature),
//           center: projection.fromLngLat(center),
//           width: glyphStyle.width ?? compileStatement(glyphStyle.width, pointFeature),
//           height: glyphStyle.height ?? compileStatement(glyphStyle.height, pointFeature),
//           margin: {
//             top: glyphStyle.margin?.top ? compileStatement(glyphStyle.margin?.top, pointFeature) : 0,
//             left: glyphStyle.margin?.left ? compileStatement(glyphStyle.margin?.left, pointFeature) : 0,
//           },
//         });

//         continue;
//       }

//       if (isTextOrGlyph) {
//         continue;
//       }

//       if (featureType === MapFeatureType.polygon) {
//         const polygonStyle = styleLayer.feature as PolygonStyle;

//         if (geojson.geometry.type === 'Polygon') {
//           const polygonFeature = geojson as Feature<Polygon>;

//           polygonGroupBuilder.addObject({
//             id: polygonFeature.id! as number,
//             type: MapFeatureType.polygon,
//             color: compileStatement(polygonStyle.color, polygonFeature),
//             vertecies: (geojson.geometry.coordinates as Array<Array<[number, number]>>).map(arr =>
//               arr.map(p => projection.fromLngLat(p)),
//             ),
//             borderWidth: 1,
//             borderColor: [0, 0, 0, 1],
//             borderJoin: LineJoinStyle.bevel,
//           });

//           continue;
//         }

//         if (geojson.geometry.type === 'MultiPolygon') {
//           const polygonFeature = geojson as Feature<MultiPolygon>;

//           for (const polygons of geojson.geometry.coordinates) {
//             polygonGroupBuilder.addObject({
//               id: polygonFeature.id! as number,
//               type: MapFeatureType.polygon,
//               color: compileStatement(polygonStyle.color, polygonFeature),
//               vertecies: ([polygons[0]] as Array<Array<[number, number]>>).map(arr =>
//                 arr.map(p => projection.fromLngLat(p)),
//               ),
//               borderWidth: 1,
//               borderColor: [0, 0, 0, 1],
//               borderJoin: LineJoinStyle.bevel,
//             });
//           }
//         }

//         continue;
//       }

//       if (featureType === MapFeatureType.line) {
//         const lineStyle = styleLayer.feature as LineStyle;

//         if (geojson.geometry.type === 'LineString') {
//           const lineFeature = geojson as Feature<LineString>;

//           lineGroupBuilder.addObject({
//             id: lineFeature.id! as number,
//             type: MapFeatureType.line,
//             color: compileStatement(lineStyle.color, lineFeature),
//             vertecies: (lineFeature.geometry.coordinates as Array<[number, number]>).map(p => projection.fromLngLat(p)),
//             width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
//             borderWidth: lineStyle.borderWidth ? compileStatement(lineStyle.borderWidth, lineFeature) : 0,
//             borderColor: lineStyle.borderColor ? compileStatement(lineStyle.borderColor, lineFeature) : [0, 0, 0, 0],
//             fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
//             join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
//             cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
//           });

//           continue;
//         }

//         if (geojson.geometry.type === 'MultiLineString') {
//           const lineFeature = geojson as Feature<MultiLineString>;

//           for (const lineGeometry of lineFeature.geometry.coordinates) {
//             lineGroupBuilder.addObject({
//               id: lineFeature.id! as number,
//               type: MapFeatureType.line,
//               color: compileStatement(lineStyle.color, lineFeature),
//               vertecies: (lineGeometry as Array<[number, number]>).map(p => projection.fromLngLat(p)),
//               width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
//               borderWidth: lineStyle.borderWidth ? compileStatement(lineStyle.borderWidth, lineFeature) : 0,
//               borderColor: lineStyle.borderColor ? compileStatement(lineStyle.borderColor, lineFeature) : [0, 0, 0, 0],
//               fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
//               join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
//               cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
//             });
//           }
//         }

//         continue;
//       }
//     }

//     if (!pointsGroupBuilder.isEmpty()) {
//       objectGroups.push(
//         pointsGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_points`, styleLayer.zIndex),
//       );
//     }

//     if (!lineGroupBuilder.isEmpty()) {
//       objectGroups.push(
//         lineGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_lines`, styleLayer.zIndex),
//       );
//     }

//     if (!polygonGroupBuilder.isEmpty()) {
//       objectGroups.push(
//         polygonGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_polygons`, styleLayer.zIndex),
//       );
//     }

//     if (!textTextureGroupBuilder.isEmpty()) {
//       objectGroups.push(
//         textTextureGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_text`, styleLayer.zIndex),
//       );
//     }

//     if (!glyphGroupBuilder.isEmpty()) {
//       objectGroups.push(
//         glyphGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_glyphs`, styleLayer.zIndex),
//       );
//     }

//     const layer: WebGlMapLayer = {
//       tileId,
//       source: source.name,
//       layerName: styleLayer.styleLayerName,
//       zIndex: styleLayer.zIndex,
//       objectGroups,
//     };
//     tileLayers.push(layer);
//   }

//   return tileLayers;
// }
