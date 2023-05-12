import { VectorTileLayer } from '@mapbox/vector-tile';
import { BBox } from "geojson";
import { GlProgram, GlPath, GlPathGroup, v2, LineStrip, GL_COLOR_BLACK, GL_COLOR_BLUE, GlNativeLineStrip } from "../../gl";
import { TransportationFeatureType, BoudaryAdminLevel } from '../features/map_features';

export interface Point {
  x: number;
  y: number;
}

/**
 * List of the supported transpormation features.
 * TODO: Support more features. 
 */
const SUPPORTED_TRANSPORTATION_FEATURES = [
  TransportationFeatureType.primary,
  TransportationFeatureType.secondary,
  TransportationFeatureType.motorway,
  TransportationFeatureType.service,
  TransportationFeatureType.path,
  TransportationFeatureType.minor,
];

const SUPPORTED_BOUNDARY_FEATURES = [
  BoudaryAdminLevel.ADMIN_LEVEL_2,
  BoudaryAdminLevel.ADMIN_LEVEL_3,
  BoudaryAdminLevel.ADMIN_LEVEL_4,
  // BoudaryAdminLevel.ADMIN_LEVEL_5,
  // BoudaryAdminLevel.ADMIN_LEVEL_6,
  // BoudaryAdminLevel.ADMIN_LEVEL_7,
  // BoudaryAdminLevel.ADMIN_LEVEL_8,
  // BoudaryAdminLevel.ADMIN_LEVEL_9,
  // BoudaryAdminLevel.ADMIN_LEVEL_10,
];

/**
 * 
 * @param gl WebGLRenderingContext
 * @param transportationLayer data layer from pbf tile.
 * @returns List of the Gl Programs representing the map features.
 */
export const getTransportationFeatures = (
  gl: WebGLRenderingContext,
  transportationLayer: VectorTileLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelRatio: number,
): GlProgram[] => {
  const programs: { [transportationFeatureType: string]: LineStrip } = {};

  for (let i = 0; i < transportationLayer.length; i++) {
    const feature = transportationLayer.feature(i);
    const transportationFeatureType = feature.properties['class'] as TransportationFeatureType;

    if (!SUPPORTED_TRANSPORTATION_FEATURES.includes(transportationFeatureType)) {
      continue;
    }

    const lines: Array<Point[]> = feature.loadGeometry();

    if (transportationFeatureType in programs) {
      programs[transportationFeatureType].push(...lines.map(points => points.map(p => [p.x, p.y] as v2)));
    } else {
      programs[transportationFeatureType] = [...lines.map(points => points.map(p => [p.x, p.y] as v2))]
    }
  }

  return Object
    .entries(programs)
    .map(([name, points]: [string, v2[][]]) => {
      const bbox = getBbox(points[0]);
      const dataWidth = bbox[2] - bbox[0];
      const dataHeight = bbox[3] - bbox[1];
      const scaleX = width / 2 / dataWidth;
      const scaleY = height / 2 / dataHeight;
 
      return new GlPathGroup(gl, {
        color: GL_COLOR_BLACK,
        paths: points.slice(0, 3000),
        translation: [(x * 2 - bbox[0] * scaleX), (y * 2 - bbox[1] * scaleY)],
        scale: [scaleX, scaleY],
        rotationInRadians: 3 * Math.PI / 2,
      });
    });
}

export const getBuildingFeatures = (
  gl: WebGLRenderingContext,
  buildingLayer: VectorTileLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelRatio: number,
): GlProgram[] => {
  return [];
};

export const getBoundaryFeatures = (
  gl: WebGLRenderingContext,
  boundaryLayer: VectorTileLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelRatio: number,
  mapWidth: number,
  mapHeight: number,
  mapBoundaries: [number, number, number, number]
): GlProgram[] => {
  const geometryFeatures: { [BoudaryAdminLevel: number]: Array<{ bbox: BBox; lines: LineStrip }> } = {};

  for (let i = 0; i < boundaryLayer.length; i++) {
    const feature = boundaryLayer.feature(i);
    const adminLevel = feature.properties['admin_level'] as BoudaryAdminLevel;

    if (!SUPPORTED_BOUNDARY_FEATURES.includes(adminLevel)) {
      continue;
    }

    const lines: Array<Point[]> = feature.loadGeometry();
    const geometryFeature = {
      bbox: feature.bbox(),
      lines: lines.map(points => points.map(p => merkatorProjection(
        p.x,
        p.y,
        mapWidth,
        mapHeight,
        mapBoundaries,
      ))),
    };

    if (adminLevel in geometryFeatures) {
      geometryFeatures[adminLevel].push(geometryFeature);
    } else {
      geometryFeatures[adminLevel] = [geometryFeature]
    }
  }

  pixelRatio = 1;

  return Object
    .values(geometryFeatures)
    .reduce((programs: GlProgram[], features: { bbox: BBox; lines: v2[][] }[]) => {
      for (const feature of features) {
        const bbox = feature.bbox;
        const dataWidth = bbox[2] - bbox[0];
        const dataHeight = bbox[3] - bbox[1];
        const scaleX = width / dataWidth;
        const scaleY = height / dataHeight;
        const scale = Math.min(scaleX, scaleY);
        
        for (const lineStrip of feature.lines) {
          programs.push(new GlNativeLineStrip(gl, {
            color: GL_COLOR_BLUE,
            points: lineStrip,
            translation: [x, y],
            // translation: [x - bbox[0] * scale, y - bbox[1] * scale],
            origin: [bbox[0], bbox[1]],
            scale: [scale, scale],
          }));
        }
      }

      return programs;
    }, [] as GlProgram[]);
};

export const getWaterFeatures = (
  gl: WebGLRenderingContext, 
  waterLayer: VectorTileLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelRatio: number,
): GlProgram[] => {
  return [];
};

export const getProjectionScale = (width: number, height: number, bbox: BBox): v2 => {
	// bbox: longitude, latitude, longitude, latitude
	const lonD = bbox[2] - bbox[0];
	const latD = bbox[3] - bbox[1];

	return [width / lonD, height / latD];
};

export const getProjectedCoords = (lon: number, lat: number, bbox: BBox, projectionScale: v2): v2 => {
	const x = (lon - bbox[0]) * projectionScale[0];
	const y = (lat - bbox[1]) * projectionScale[1];

	return [x, y];
};

export const getBbox = (line: v2[]): [number, number, number, number] => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of line) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
 
  return [minX, minY, maxX, maxY];
};

export const merkatorProjection = (
  lat: number, 
  lon: number,
  mapWidth: number,
  mapHeight: number,
  mapBoundaries: [number, number, number, number],
): v2 => {
    lat = lat * Math.PI / 180;
    const [mapLonLeft, mapLatTop, mapLonRight, mapLatBottom] = mapBoundaries;
    const mapLonDelta = mapLonRight - mapLonLeft;
    const mapLatBottomDegree = mapLatBottom * Math.PI / 180;
    const x = (lon - mapLonLeft) * (mapWidth / mapLonDelta);
    const worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI);
    const mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree))));
    const y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - mapOffsetY);

    // const x = (180 + lon) / 360;
    // const y = (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;

    // return [x * mapWidth, y * mapHeight];

    return [x, y];
}

export const getTileBorders = (
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelRatio: number,
): GlProgram[] => {
  pixelRatio = 1;

  return [
    new GlPath(gl, {
      color: GL_COLOR_BLACK,
      points: [
        [0, 0],
        [width * pixelRatio, 0],
        [width * pixelRatio, height * pixelRatio],
        [0, height * pixelRatio],
        [0, 0],
      ],
      translation: [x * pixelRatio, y * pixelRatio],
    }),
  ];
};