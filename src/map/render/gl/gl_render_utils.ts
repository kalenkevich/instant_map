import { Feature, LineString, Polygon } from 'geojson';
import { SipmlifyGeometryOptions, DefaultSipmlifyGeometryOptions } from '../simplify';
import { TileLayer } from '../../tile/tile';
import { GlProgram, WebGlPath, v2, GL_COLOR_BLACK, WebGlNativeLineStrip, WebGlArea, WebGlLineStrip } from '../../../webgl';
import { WaterFeatureClass, LandCoverFeatureClass, TransportationFeatureClass } from '../../features/map_features';
import { WaterFeatureClassColorMap, LandCoverClassColorMap, BUILDING_COLOR, BOUNDARY_COLOR, TranpostationClassStyleMap } from '../../features/map_features_styles';
import {
  getWaterFeatureCollection,
  getLandCoverFeatureCollection,
  getBoundaryFeatureCollection,
  getTransportationFeatureCollection,
  getBuildingFeatureCollection,
} from '../geojson_utils';

export const getWaterGlPrograms = (
  waterLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  rotationInRadians: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
) => {
  const fc = getWaterFeatureCollection(waterLayer, simplifyOptions);

  return fc.features.reduce((programs: GlProgram[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      programs.push(
        new WebGlArea({
          color: WaterFeatureClassColorMap[feature.properties['class'] as WaterFeatureClass].toGlColor(),
          points: area as v2[],
          translation: [0, 0],
          origin: [x, y],
          scale,
          rotationInRadians,
        })
      );
    }

    return programs;
  }, [] as GlProgram[]);
};

export const getLandCoverGlPrograms = (
  landCoverLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  rotationInRadians: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  const fc = getLandCoverFeatureCollection(landCoverLayer, simplifyOptions);

  return fc.features.reduce((programs: GlProgram[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      programs.push(
        new WebGlArea({
          color: LandCoverClassColorMap[feature.properties['class'] as LandCoverFeatureClass].toGlColor(),
          points: area as v2[],
          translation: [0, 0],
          origin: [x, y],
          scale,
          rotationInRadians,
        })
      );
    }

    return programs;
  }, [] as GlProgram[]);
}

export const getBoundaryGlPrograms = (
  boundaryLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  rotationInRadians: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  const fc = getBoundaryFeatureCollection(boundaryLayer, simplifyOptions);

  return fc.features.reduce((programs: GlProgram[], feature: Feature) => {
    for (const lineStrip of (feature.geometry as Polygon).coordinates) {
      programs.push(
        new WebGlNativeLineStrip({
          color: BOUNDARY_COLOR.toGlColor(),
          points: lineStrip as v2[],
          translation: [0, 0],
          origin: [x, y],
          scale,
          rotationInRadians,
        })
      );
    }

    return programs;
  }, [] as GlProgram[]);
}

export const getTransportationGlPrograms = (
  transportationLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  rotationInRadians: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  const fc = getTransportationFeatureCollection(transportationLayer, simplifyOptions);

  return fc.features.map((feature: Feature) => {
    const resultPoints: v2[] = (feature.geometry as LineString).coordinates as v2[];
    const style = TranpostationClassStyleMap[feature.properties['class'] as TransportationFeatureClass];

    return new WebGlLineStrip({
      lineWidth: style.lineWidth,
      color: style.color.toGlColor(),
      points: resultPoints,
      translation: [0, 0],
      origin: [x, y],
      scale,
      rotationInRadians,
    });
  });
}

export const getBuildingGlPrograms = (
  buildingLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  rotationInRadians: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): GlProgram[] => {
  const fc = getBuildingFeatureCollection(buildingLayer, simplifyOptions);

  return fc.features.reduce((programs, feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      programs.push(
        new WebGlArea({
          color: BUILDING_COLOR.toGlColor(),
          points: area as v2[],
          translation: [0, 0],
          origin: [x, y],
          scale,
          rotationInRadians,
        })
      );
    }

    return programs;
  }, [] as GlProgram[]);
}

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

