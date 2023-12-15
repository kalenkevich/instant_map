// import { vec4, vec2 } from 'gl-matrix';
// import { MapTileFeatureType } from '../../tile/tile';

// export type WebGlObject = WebGlPoint | WebGlPolygon | WebGlLine | WebGlText | WebGlIcon;

// export type WebGlObjectBufferredGroup =
//   | WebGlPointBufferredGroup
//   | WebGlPolygonBufferredGroup
//   | WebGlLineBufferredGroup
//   | WebGlTextBufferredGroup;

// // checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
// export enum LineJoinStyle {
//   miter = 'miter',
//   round = 'round',
//   bevel = 'bevel',
// }

// // checkout https://wwwtyro.net/2019/11/18/instanced-lines.html
// export enum LineCapStyle {
//   butt = 'butt',
//   round = 'round',
//   square = 'square',
// }

// export enum LineFillStyle {
//   solid = 'solid',
//   dashed = 'dashed',
//   dotted = 'dotted',
//   dotdashed = 'dotdashed',
// }

// // in-sync with WebGL types.
// export enum WebGlObjectAttributeType {
//   BYTE = 0x1400,
//   UNSIGNED_BYTE = 0x1401,
//   SHORT = 0x1402,
//   UNSIGNED_SHORT = 0x1403,
//   INT = 0x1404,
//   UNSIGNED_INT = 0x1405,
//   FLOAT = 0x1406,
// }

// export interface WebGlObjectAttributeDescriptor<AttributeType, SizeType, ArrayType> {
//   type: AttributeType;
//   size: SizeType; // dimention of the element: number -> 1, vec2 -> 2, vec3 -> 3, vec4 -> 4 and etc.
//   buffer: ArrayType;
// }

// // ---------------- POINT: Begin ------------------
// export interface WebGlPoint {
//   type: MapTileFeatureType.point;
//   color: vec4 | [number, number, number, number];
//   center: vec2 | [number, number];
//   radius: number;
//   components?: number;

//   // TODO: support this
//   borderWidth: number;
//   borderColor: vec4 | [number, number, number, number];
// }

// export interface WebGlPointBufferredGroup {
//   type: MapTileFeatureType.point;
//   size: number; // group size | number of instances;
//   numElements: number; // number of elements
//   color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
//   vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
//   borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
//   borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
// }
// // ---------------- POINT: End ------------------

// // ---------------- Polygon: Begin ------------------
// export interface WebGlPolygon {
//   type: MapTileFeatureType.polygon;
//   color: vec4;
//   vertecies: Array<Array<vec2 | [number, number]>>;

//   // TODO: support this
//   borderWidth: number;
//   borderColor: vec4;
//   borderJoin: LineJoinStyle;
// }

// export interface WebGlPolygonBufferredGroup {
//   type: MapTileFeatureType.polygon;
//   size: number; // group size | number of instances;
//   numElements: number; // number of elements
//   color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
//   vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
//   borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
//   borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
// }
// // ---------------- Polygon: End ------------------

// // ---------------- Line: Begin ------------------
// export interface WebGlLine {
//   type: MapTileFeatureType.line;
//   color: vec4;
//   width: number;
//   vertecies: Array<vec2 | [number, number]>;
//   // vertecies: Array<Array<vec2 | [number, number]>>;

//   // TODO: support this
//   fill: LineFillStyle;
//   join: LineJoinStyle;
//   cap: LineCapStyle;
//   borderWidth: number;
//   borderColor: vec4;
// }

// export interface WebGlLineBufferredGroup {
//   type: MapTileFeatureType.line;
//   size: number; // group size | number of instances;
//   numElements: number; // number of elements
//   color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
//   width: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
//   vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 3, Float32Array>; // Array<vec2>;
//   borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
//   borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
// }
// // ---------------- Line: End ------------------

// // ---------------- Text: Begin ------------------
// export interface WebGlText {
//   type: MapTileFeatureType.text;
//   color: vec4;
//   font: string;
//   fontSize: number;
//   text: string;
//   center: vec2 | [number, number];

//   // TODO: support this
//   borderWidth: number;
//   borderColor: vec4;
// }

// export interface WebGlTextBufferredGroup {
//   type: MapTileFeatureType.text;
//   size: number; // group size | number of instances;
//   numElements: number; // number of elements
//   color: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
//   vertecies: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 2, Float32Array>; // Array<vec2>;
//   borderWidth: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 1, Float32Array>; // Array<number>;
//   borderColor: WebGlObjectAttributeDescriptor<WebGlObjectAttributeType.FLOAT, 4, Float32Array>; // Array<vec4>;
// }
// // ---------------- Text: End ------------------

// export interface WebGlIcon {
//   type: MapTileFeatureType.icon;
// }
