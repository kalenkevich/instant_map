import { Feature, Geometry, Polygon } from 'geojson';
import { simplify } from '../simplify';
import { TileLayer, TileFeature } from '../../tile/tile';
import { GlProgram, WebGlPath, WebGlPathGroup, v2, LineStrip, GL_COLOR_BLACK, WebGlNativeLineStrip, WebGlArea, RGBColor } from '../../../webgl';
import { TransportationFeatureType, BoudaryAdminLevel, WaterFeatureClass, LandCoverFeatureClass } from '../../features/map_features';

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
  WaterFeatureClass.dock,
  WaterFeatureClass.river,
  WaterFeatureClass.lake,
  WaterFeatureClass.swimming_pool,
];

const SUPPORTED_LAND_COVER_FEATURES = [
  LandCoverFeatureClass.farmland,
  LandCoverFeatureClass.ice,
  LandCoverFeatureClass.wood,
  LandCoverFeatureClass.rock,
  LandCoverFeatureClass.grass,
  LandCoverFeatureClass.wetland,
  LandCoverFeatureClass.sand,
  LandCoverFeatureClass.crop,
  LandCoverFeatureClass.scrub,
  LandCoverFeatureClass.tree,
  LandCoverFeatureClass.forest,
  LandCoverFeatureClass.snow,
];

export const WaterFeatureClassColorMap = {
  [WaterFeatureClass.ocean]: RGBColor.toGLColor(95, 200, 255),
  [WaterFeatureClass.dock]: RGBColor.toGLColor(95, 200, 255),
  [WaterFeatureClass.river]: RGBColor.toGLColor(95, 200, 255),
  [WaterFeatureClass.lake]: RGBColor.toGLColor(95, 200, 255),
  [WaterFeatureClass.swimming_pool]: RGBColor.toGLColor(95, 200, 255),
};

export const LandCoverClassColorMap = {
  [LandCoverFeatureClass.farmland]: RGBColor.toGLColor(173, 226, 167),
  [LandCoverFeatureClass.sand]: RGBColor.toGLColor(245, 241, 241),
  [LandCoverFeatureClass.ice]: RGBColor.toGLColor(233, 239, 244),
  [LandCoverFeatureClass.rock]: RGBColor.toGLColor(204, 208, 205),
  [LandCoverFeatureClass.wood]: RGBColor.toGLColor(180, 203, 165),
  [LandCoverFeatureClass.grass]: RGBColor.toGLColor(173, 226, 167),
  [LandCoverFeatureClass.wetland]: RGBColor.toGLColor(188, 232, 181),

  [LandCoverFeatureClass.crop]: RGBColor.toGLColor(173, 226, 167),
  [LandCoverFeatureClass.scrub]: RGBColor.toGLColor(238, 234, 231),
  [LandCoverFeatureClass.tree]: RGBColor.toGLColor(194, 228, 187),
  [LandCoverFeatureClass.forest]: RGBColor.toGLColor(194, 228, 187),
  [LandCoverFeatureClass.snow]: RGBColor.toGLColor(233, 239, 244),
};

export const BOUNDARY_COLOR = RGBColor.toGLColor(114, 113, 207);

export const BUILDING_COLOR = RGBColor.toGLColor(222, 215, 211);

export interface SipmlifyGeometryOptions {
  tolerance?: number;
  highQuality?: boolean;
  mutate?: boolean;
  enabled: boolean;
};

export const DefaultSipmlifyGeometryOptions = {
  highQuality: false,
  mutate: true, // performance increase
  enabled: true,
};

/**
 *
 * @param gl WebGLRenderingContext
 * @param transportationLayer data layer from pbf tile.
 * @returns List of the Gl Programs representing the map features.
 */
export const getTransportationFeatures = (
  transportationLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  if (!transportationLayer || !transportationLayer.features.length) {
    return [];
  }

  const programs: { [transportationFeatureType: string]: LineStrip } = {};

  for (const feature of transportationLayer.features) {
    const transportationFeatureType = feature.properties['class'] as TransportationFeatureType;

    if (!SUPPORTED_TRANSPORTATION_FEATURES.includes(transportationFeatureType)) {
      continue;
    }

    const lines = feature.geometry;

    if (transportationFeatureType in programs) {
      programs[transportationFeatureType].push(...lines);
    } else {
      programs[transportationFeatureType] = [...lines];
    }
  }

  return Object.entries(programs).map(([name, points]: [string, v2[][]]) => {
    const resultPoints = simplifyOptions.enabled
      ? points.map(p => simplify(p, simplifyOptions.tolerance, simplifyOptions.highQuality))
      : points;

    return new WebGlPathGroup({
      color: GL_COLOR_BLACK,
      paths: resultPoints,
      translation: [x, y],
      scale,
    });
  });
};

export const getBuildingFeatures = (
  buildingLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  if (!buildingLayer || !buildingLayer.features.length) {
    return [];
  }

  const geometryFeatures: Array<Feature> = [];

  for (const feature of buildingLayer.features) {
    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    geometryFeatures.push(geometryFeature);
  }

  return geometryFeatures.reduce((programs, feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      programs.push(
        new WebGlArea({
          color: BUILDING_COLOR,
          points: simplifyOptions.enabled
              ? simplify(area as v2[], simplifyOptions.tolerance, simplifyOptions.highQuality)
              : area as v2[],
          translation: [x, y],
          scale,
        })
      );
    }

    return programs;
  }, [] as GlProgram[]);
};

export const getBoundaryFeatures = (
  boundaryLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  if (!boundaryLayer || !boundaryLayer.features.length) {
    return [];
  }

  const geometryFeatures: { [BoudaryAdminLevel: number]: Array<Feature> } = {};

  for (const feature of boundaryLayer.features) {
    const adminLevel = feature.properties['admin_level'] as BoudaryAdminLevel;

    if (!SUPPORTED_BOUNDARY_FEATURES.includes(adminLevel)) {
      continue;
    }

    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    if (adminLevel in geometryFeatures) {
      geometryFeatures[adminLevel].push(geometryFeature);
    } else {
      geometryFeatures[adminLevel] = [geometryFeature];
    }
  }

  return Object.values(geometryFeatures).reduce((programs: GlProgram[], features: Array<Feature>) => {
    for (const feature of features) {
      for (const lineStrip of (feature.geometry as Polygon).coordinates) {
        programs.push(
          new WebGlNativeLineStrip({
            color: BOUNDARY_COLOR,
            points:  simplifyOptions.enabled
              ? simplify(lineStrip as v2[], simplifyOptions.tolerance, simplifyOptions.highQuality)
              : lineStrip as v2[],
            translation: [x, y],
            scale,
          })
        );
      }
    }

    return programs;
  }, [] as GlProgram[]);
};

export const getWaterFeatures = (
  waterLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  if (!waterLayer || !waterLayer.features.length) {
    return [];
  }

  const geometryFeatures: { [WaterFeatures: string]: Array<Feature> } = {};

  for (const feature of waterLayer.features) {
    const waterClass = feature.properties['class'] as WaterFeatureClass;

    if (!SUPPORTED_WATER_FEATURES.includes(waterClass)) {
      continue;
    }

    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    if (waterClass in geometryFeatures) {
      geometryFeatures[waterClass].push(geometryFeature);
    } else {
      geometryFeatures[waterClass] = [geometryFeature];
    }
  }

  return Object.entries(geometryFeatures).reduce((programs: GlProgram[], [waterClass, features]: [WaterFeatureClass, Feature[]]) => {
    for (const feature of features) {
      for (const area of (feature.geometry as Polygon).coordinates) {
        programs.push(
          new WebGlArea({
            color: WaterFeatureClassColorMap[waterClass],
            points: simplifyOptions.enabled
              ? simplify(area as v2[], simplifyOptions.tolerance, simplifyOptions.highQuality)
              : area as v2[],
            translation: [x, y],
            scale,
          })
        );
      }
    }

    return programs;
  }, [] as GlProgram[]);
};

export const getLandCoverFeatures = (
  landCoverLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  if (!landCoverLayer || !landCoverLayer.features.length) {
    return [];
  }

  const geometryFeatures: { [WaterFeatures: string]: Array<Feature> } = {};

  for (const feature of landCoverLayer.features) {
    const landClass = feature.properties['class'] as LandCoverFeatureClass;

    if (!SUPPORTED_LAND_COVER_FEATURES.includes(landClass)) {
      continue;
    }

    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    if (landClass in geometryFeatures) {
      geometryFeatures[landClass].push(geometryFeature);
    } else {
      geometryFeatures[landClass] = [geometryFeature];
    }
  }

  return Object.entries(geometryFeatures).reduce((programs: GlProgram[], [landClass, features]: [LandCoverFeatureClass, Feature[]]) => {
    for (const feature of features) {
      for (const area of (feature.geometry as Polygon).coordinates) {
        programs.push(
          new WebGlArea({
            color: LandCoverClassColorMap[landClass],
            points: simplifyOptions.enabled
              ? simplify(area as v2[], simplifyOptions.tolerance, simplifyOptions.highQuality)
              : area as v2[],
            translation: [x, y],
            scale,
          })
        );
      }
    }

    return programs;
  }, [] as GlProgram[]);
};

export const getTileBorders = (x: number, y: number, width: number, height: number): GlProgram[] => {
  return [
    new WebGlPath({
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

const getGeoJsonFeatureFromVectorTile = (
  feature: TileFeature,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Feature => {
  const geometryFeature: Feature = {
    type: 'Feature',
    bbox: feature.bbox,
    geometry: getGeometryFromVectorTile(feature),
    properties: {},
  };
  
  return geometryFeature;
};

const getGeometryFromVectorTile = (
  feature: TileFeature,
): Geometry => {
  const points = feature.geometry;

  return {
    type: 'MultiLineString',
    coordinates: points,
  };
};