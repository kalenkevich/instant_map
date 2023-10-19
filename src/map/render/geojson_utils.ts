/** @deprecated please use pbf_tile_utils instead. */

import { Feature, FeatureCollection, MultiLineString, Position } from 'geojson';
import { simplify, SipmlifyGeometryOptions, DefaultSipmlifyGeometryOptions } from './simplify';
import { TileLayer } from '../tile/tile_layer';
import { TileFeature } from '../tile/tile_feature';
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

/** @deprecated please use pbf_tile_utils instead. */
export const getTransportationFeatureCollection = (
  transportationLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): FeatureCollection => {
  if (!transportationLayer || transportationLayer.isEmpty()) {
    return EmptyFC;
  }

  const features: Feature[] = [];

  for (const feature of transportationLayer.getFeatures()) {
    const transportationFeatureType = feature.getProperties()['class'] as TransportationFeatureClass;

    if (!SUPPORTED_TRANSPORTATION_FEATURES.includes(transportationFeatureType)) {
      continue;
    }

    const lines = (feature.getGeometry() as MultiLineString).coordinates;
    for (const line of lines) {
      const geoJsonFeature: Feature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: simplifyOptions.enabled
            ? simplify(line, simplifyOptions.tolerance, simplifyOptions.highQuality)
            : (line as Position[]),
        },
        properties: {
          layer: 'transportation',
          class: transportationFeatureType,
          ...feature.getProperties(),
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

/** @deprecated please use pbf_tile_utils instead. */
export const getBuildingFeatureCollection = (
  buildingLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): FeatureCollection => {
  if (!buildingLayer || buildingLayer.isEmpty()) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of buildingLayer.getFeatures()) {
    const geometryFeature = getGeoJsonFeatureFromVectorTile(feature, simplifyOptions);

    geometryFeatures.push(geometryFeature);
  }

  return {
    type: 'FeatureCollection',
    features: geometryFeatures,
  };
};

/** @deprecated please use pbf_tile_utils instead. */
export const getBoundaryFeatureCollection = (
  boundaryLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): FeatureCollection => {
  if (!boundaryLayer || boundaryLayer.isEmpty()) {
    return EmptyFC;
  }

  const geometryFeatures: { [BoudaryAdminLevel: number]: Feature[] } = {};

  for (const feature of boundaryLayer.getFeatures()) {
    const adminLevel = feature.getProperties()['admin_level'] as BoudaryAdminLevel;

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

/** @deprecated please use pbf_tile_utils instead. */
export const getWaterFeatureCollection = (
  waterLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): FeatureCollection => {
  if (!waterLayer || waterLayer.isEmpty()) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of waterLayer.getFeatures()) {
    const waterClass = feature.getProperties()['class'] as WaterFeatureClass;

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

/** @deprecated please use pbf_tile_utils instead. */
export const getLandCoverFeatureCollection = (
  landCoverLayer: TileLayer,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): FeatureCollection => {
  if (!landCoverLayer || landCoverLayer.isEmpty()) {
    return EmptyFC;
  }

  const geometryFeatures: Feature[] = [];

  for (const feature of landCoverLayer.getFeatures()) {
    const landClass = feature.getProperties()['class'] as LandCoverFeatureClass;

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
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions
): Feature => {
  const geojsonFeature = feature.getGeoJsonFeature();

  if (!simplifyOptions.enabled) {
    return geojsonFeature;
  }

  if (geojsonFeature.geometry.type === 'MultiLineString') {
    for (const points of (geojsonFeature.geometry as MultiLineString).coordinates) {
      simplify(points, simplifyOptions.tolerance, simplifyOptions.highQuality);
    }
  }

  return geojsonFeature;
};
