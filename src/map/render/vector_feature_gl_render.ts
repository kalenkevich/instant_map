import { VectorTileLayer } from '@mapbox/vector-tile';
import { BBox } from "geojson";
import { GlProgram, GlPath, GlPathGroup, v2, LineStrip, Area, GL_COLOR_BLACK, GlNativeLineStrip, GlArea, RGBColor } from "../../gl";
import { TransportationFeatureType, BoudaryAdminLevel, WaterFeatureClass, LandCoverFeatureClass } from '../features/map_features';

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
  BoudaryAdminLevel.ADMIN_LEVEL_5,
  BoudaryAdminLevel.ADMIN_LEVEL_6,
  BoudaryAdminLevel.ADMIN_LEVEL_7,
  BoudaryAdminLevel.ADMIN_LEVEL_8,
  BoudaryAdminLevel.ADMIN_LEVEL_9,
  BoudaryAdminLevel.ADMIN_LEVEL_10,
];

const SUPPORTED_WATER_FEATURES = [
  WaterFeatureClass.ocean,
];
 
const SUPPORTED_LAND_COVER_FEATURES = [
  LandCoverFeatureClass.farmland,
  LandCoverFeatureClass.ice,
  LandCoverFeatureClass.wood,
  LandCoverFeatureClass.rock,
  LandCoverFeatureClass.grass,
  LandCoverFeatureClass.wetland,
  LandCoverFeatureClass.sand,
];

export const WaterFeatureClassColorMap = {
  [WaterFeatureClass.ocean]: RGBColor.toGLColor(95,200,255),
  [WaterFeatureClass.dock]: RGBColor.toGLColor(95,200,255),
  [WaterFeatureClass.ocean]: RGBColor.toGLColor(95,200,255),
  [WaterFeatureClass.river]: RGBColor.toGLColor(95,200,255),
  [WaterFeatureClass.lake]: RGBColor.toGLColor(95,200,255),
  [WaterFeatureClass.swimming_pool]: RGBColor.toGLColor(95,200,255),
};

export const LandCoverClassColorMap = {
  [LandCoverFeatureClass.farmland]: RGBColor.toGLColor(173,226,167),
  [LandCoverFeatureClass.sand]: RGBColor.toGLColor(245,241,241),
  [LandCoverFeatureClass.ice]: RGBColor.toGLColor(233,239,244),
  [LandCoverFeatureClass.rock]: RGBColor.toGLColor(204,208,205),
  [LandCoverFeatureClass.wood]: RGBColor.toGLColor(180,203,165),
  [LandCoverFeatureClass.grass]: RGBColor.toGLColor(173,226,167),
  [LandCoverFeatureClass.wetland]: RGBColor.toGLColor(188,232,181),

  [LandCoverFeatureClass.crop]: RGBColor.toGLColor(173,226,167),
  [LandCoverFeatureClass.scrub]: RGBColor.toGLColor(238,234,231),
  [LandCoverFeatureClass.tree]: RGBColor.toGLColor(194,228,187),
  [LandCoverFeatureClass.forest]: RGBColor.toGLColor(194,228,187),
  [LandCoverFeatureClass.snow]: RGBColor.toGLColor(233,239,244),
};

export const BOUNDARY_COLOR = RGBColor.toGLColor(114,113,207);

export const BUILDING_COLOR = RGBColor.toGLColor(222, 215, 211);

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
  scale: [number, number],
): GlProgram[] => {
  if (!transportationLayer || !transportationLayer.length) {
    return [];
  }

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
      return new GlPathGroup(gl, {
        color: GL_COLOR_BLACK,
        paths: points,
        translation: [x, y],
        scale,
      });
    });
}

export const getBuildingFeatures = (
  gl: WebGLRenderingContext,
  buildingLayer: VectorTileLayer,
  x: number,
  y: number,
  scale: [number, number],
): GlProgram[] => {
  if (!buildingLayer || !buildingLayer.length) {
    return [];
  }

  const geometryFeatures: Array<{ bbox: BBox; areas: Area[]; }> = [];

  for (let i = 0; i < buildingLayer.length; i++) {
    const feature = buildingLayer.feature(i);

    const areas: Array<Point[]> = feature.loadGeometry();
    const geometryFeature = {
      bbox: feature.bbox(),
      areas: areas.map(area => area.map(p => ([p.x, p.y] as v2))),
    };

    geometryFeatures.push(geometryFeature);
  }

  return geometryFeatures
    .reduce((programs, feature) => {
        for (const area of feature.areas) {
          programs.push(new GlArea(gl, {
            color: BUILDING_COLOR,
            points: area,
            translation: [x, y],
            scale,
          }));
        }
      
        return programs;
    }, [] as GlProgram[]);
};

export const getBoundaryFeatures = (
  gl: WebGLRenderingContext,
  boundaryLayer: VectorTileLayer,
  x: number,
  y: number,
  scale: [number, number],
): GlProgram[] => {
  if (!boundaryLayer || !boundaryLayer.length) {
    return [];
  }

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
      lines: lines.map(points => points.map(p => ([p.x, p.y] as v2))),
    };

    if (adminLevel in geometryFeatures) {
      geometryFeatures[adminLevel].push(geometryFeature);
    } else {
      geometryFeatures[adminLevel] = [geometryFeature]
    }
  }

  return Object
    .values(geometryFeatures)
    .reduce((programs: GlProgram[], features: { bbox: BBox; lines: v2[][] }[]) => {
      for (const feature of features) {
        for (const lineStrip of feature.lines) {
          programs.push(new GlNativeLineStrip(gl, {
            color: BOUNDARY_COLOR,
            points: lineStrip,
            translation: [x, y],
            scale,
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
  scale: [number, number],
): GlProgram[] => {
  if (!waterLayer || !waterLayer.length) {
    return [];
  }

  const geometryFeatures: { [WaterFeatures: string]: Array<{ bbox: BBox; areas: Area[] }> } = {};

  for (let i = 0; i < waterLayer.length; i++) {
    const feature = waterLayer.feature(i);
    const waterClass = feature.properties['class'] as WaterFeatureClass;

    if (!SUPPORTED_WATER_FEATURES.includes(waterClass)) {
      continue;
    }

    const areas: Array<Point[]> = feature.loadGeometry();
    const geometryFeature = {
      bbox: feature.bbox(),
      areas: areas.map(area => area.map(p => ([p.x, p.y] as v2))),
    };

    if (waterClass in geometryFeatures) {
      geometryFeatures[waterClass].push(geometryFeature);
    } else {
      geometryFeatures[waterClass] = [geometryFeature]
    }
  }

  return Object
    .entries(geometryFeatures)
    .reduce((programs: GlProgram[], [waterClass, features]: [WaterFeatureClass, { bbox: BBox; areas: Area[] }[]]) => {
      for (const feature of features) {
        for (const area of feature.areas) {
          programs.push(new GlArea(gl, {
            color: WaterFeatureClassColorMap[waterClass],
            points: area,
            translation: [x, y],
            scale,
          }));
        }
      }

      return programs;
    }, [] as GlProgram[]);
};

export const getLandCoverFeatures = (
  gl: WebGLRenderingContext,
  landCoverLayer: VectorTileLayer,
  x: number,
  y: number,
  scale: [number, number],
): GlProgram[] => {
  if (!landCoverLayer || !landCoverLayer.length) {
    return [];
  }

  const geometryFeatures: { [WaterFeatures: string]: Array<{ bbox: BBox; areas: Area[] }> } = {};

  for (let i = 0; i < landCoverLayer.length; i++) {
    const feature = landCoverLayer.feature(i);
    const landClass = feature.properties['class'] as LandCoverFeatureClass;

    if (!SUPPORTED_LAND_COVER_FEATURES.includes(landClass)) {
      continue;
    }

    const areas: Array<Point[]> = feature.loadGeometry();
    const geometryFeature = {
      bbox: feature.bbox(),
      areas: areas.map(area => area.map(p => ([p.x, p.y] as v2))),
    };

    if (landClass in geometryFeatures) {
      geometryFeatures[landClass].push(geometryFeature);
    } else {
      geometryFeatures[landClass] = [geometryFeature]
    }
  }

  return Object
    .entries(geometryFeatures)
    .reduce((programs: GlProgram[], [landClass, features]: [LandCoverFeatureClass, { bbox: BBox; areas: Area[] }[]]) => {
      for (const feature of features) {
        for (const area of feature.areas) {
          programs.push(new GlArea(gl, {
            color: LandCoverClassColorMap[landClass],
            points: area,
            translation: [x, y],
            scale,
          }));
        }
      }

      return programs;
    }, [] as GlProgram[]);
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
  x: number, 
  y: number,
  mapWidth: number,
  mapHeight: number,
  mapBoundaries: [number, number, number, number],
): v2 => {
    // lat = lat * Math.PI / 180;
    // // [-180,-85.0511,180,85.0511]
    // const [mapLonLeft, mapLatBottom, mapLonRight, mapLatTop] = mapBoundaries;
    // const mapLonDelta = mapLonRight - mapLonLeft;
    // const mapLatBottomDegree = mapLatBottom * Math.PI / 180;
    // const x = (lon - mapLonLeft) * (mapWidth / mapLonDelta);
    // const worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI);
    // const mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree))));
    // const y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - mapOffsetY);

    // const x = (180 + lon) / 360;
    // const y = (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;

    // return [x * mapWidth, y * mapHeight];
    const scaleFactor = mapWidth / 2 / Math.PI;

    return [x , y];
}

export const getTileBorders = (
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number,
): GlProgram[] => {
  return [
    new GlPath(gl, {
      color: GL_COLOR_BLACK,
      points: [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
        [0, 0],
      ],
      translation: [x, y],
    }),
  ];
};