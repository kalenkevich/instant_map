import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { simplify, SipmlifyGeometryOptions, DefaultSipmlifyGeometryOptions } from './simplify';
import { TileLayer, TileFeature } from '../tile/tile';
import {
  TransportationFeatureClass,
  BoudaryAdminLevel,
  WaterFeatureClass,
  LandCoverFeatureClass,
  SUPPORTED_TRANSPORTATION_FEATURES,
  SUPPORTED_BOUNDARY_FEATURES,
  SUPPORTED_WATER_FEATURES,
  SUPPORTED_LAND_COVER_FEATURES,
} from '../features/map_features';

const EmptyFC: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export const getTransportationFeatureCollection = (
  transportationLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): FeatureCollection => {
  if (!transportationLayer || !transportationLayer.features.length) {
    return EmptyFC;
  }

  const features: Feature[] = [];

  for (const feature of transportationLayer.features) {
    const transportationFeatureType = feature.properties['class'] as TransportationFeatureClass;

    if (!SUPPORTED_TRANSPORTATION_FEATURES.includes(transportationFeatureType)) {
      continue;
    }

    const lines = feature.geometry;
    for (const line of lines) {
      const geoJsonFeature: Feature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: simplifyOptions.enabled
            ? simplify(line, simplifyOptions.tolerance, simplifyOptions.highQuality)
            : line as Position[],
        },
        properties: {
          layer: 'transportation',
          class: transportationFeatureType,
          ...feature.properties,
        },
      };

      features.push(geoJsonFeature);
    }
  }

  return {
    type: 'FeatureCollection',
    features, 
  };
};

export const getBuildingFeatureCollection = (
  buildingLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): FeatureCollection => {
  if (!buildingLayer || !buildingLayer.features.length) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of buildingLayer.features) {
    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    geometryFeatures.push(geometryFeature);
  }

  return {
    type: 'FeatureCollection',
    features: geometryFeatures,
  };
};

export const getBoundaryFeatureCollection = (
  boundaryLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): FeatureCollection => {
  if (!boundaryLayer || !boundaryLayer.features.length) {
    return EmptyFC;
  }

  const geometryFeatures: { [BoudaryAdminLevel: number]: Feature[] } = {};

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

  return {
    type: 'FeatureCollection',
    features: Object.values(geometryFeatures).flatMap(features => features),
  };
};

export const getWaterFeatureCollection = (
  waterLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): FeatureCollection => {
  if (!waterLayer || !waterLayer.features.length) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of waterLayer.features) {
    const waterClass = feature.properties['class'] as WaterFeatureClass;

    if (!SUPPORTED_WATER_FEATURES.includes(waterClass)) {
      continue;
    }

    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    geometryFeatures.push(geometryFeature);
  }

  return {
    type: 'FeatureCollection',
    features: geometryFeatures,
  };
};

export const getLandCoverFeatureCollection = (
  landCoverLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): FeatureCollection => {
  if (!landCoverLayer || !landCoverLayer.features.length) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of landCoverLayer.features) {
    const landClass = feature.properties['class'] as LandCoverFeatureClass;

    if (!SUPPORTED_LAND_COVER_FEATURES.includes(landClass)) {
      continue;
    }

    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    geometryFeatures.push(geometryFeature);
  }

  return {
    type: 'FeatureCollection',
    features: geometryFeatures,
  };
};

const getGeoJsonFeatureFromVectorTile = (
  feature: TileFeature,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Feature => {
  const geometryFeature: Feature = {
    type: 'Feature',
    bbox: feature.bbox,
    geometry: getGeometryFromVectorTile(feature, simplifyOptions),
    properties: feature.properties,
  };
  
  return geometryFeature;
};

const getGeometryFromVectorTile = (
  feature: TileFeature,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Geometry => {
  const coordinates: Array<Position[]> = [];

  for (const points of feature.geometry) {
    const simplifiedPoints = simplifyOptions.enabled
      ? simplify(points, simplifyOptions.tolerance, simplifyOptions.highQuality)
      : points;

    coordinates.push(simplifiedPoints);
  }

  return {
    type: 'MultiLineString',
    coordinates,
  };
};