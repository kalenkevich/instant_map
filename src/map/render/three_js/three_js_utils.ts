import * as THREE from 'three';
import { Feature, LineString, Polygon } from 'geojson';
import { WaterFeatureClass, LandCoverFeatureClass } from '../../features/map_features';
import { WaterFeatureClassColorMap, LandCoverClassColorMap, BUILDING_COLOR, BOUNDARY_COLOR, TRANSPORTATION_COLOR } from '../../features/map_features_styles';
import { TileLayer } from '../../tile/tile';
import { SipmlifyGeometryOptions, DefaultSipmlifyGeometryOptions } from '../simplify';
import {
  getWaterFeatureCollection,
  getLandCoverFeatureCollection,
  getBoundaryFeatureCollection,
  getTransportationFeatureCollection,
  getBuildingFeatureCollection,
} from '../geojson_utils';

export const getWaterThreeJsObjects = (
  waterLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): THREE.Object3D[] => {
  const fc = getWaterFeatureCollection(waterLayer, simplifyOptions);

  return fc.features.reduce((objects: THREE.Object3D[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      const material = new THREE.MeshBasicMaterial({
        color: WaterFeatureClassColorMap[feature.properties['class'] as WaterFeatureClass].toThreeJsColor(),
      });

      const shape = new THREE.Shape();
      shape.moveTo(area[0][0], area[0][1]);
      for (let i = 1; i < area.length; i++) {
        shape.lineTo(area[i][0], area[i][1]);
      }

      const geometry = new THREE.ShapeGeometry(shape, 12);
      // geometry.center();
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geometry, material));
      group.translateX(x);
      group.translateY(y);
      group.scale.set(scale[0], scale[1], 1);

      objects.push(group);
    }

    return objects;
  }, [] as THREE.Object3D[]);
}

export const getLandCoverThreeJsObjects = (
  landCoverLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): THREE.Object3D[] => {

  const fc = getLandCoverFeatureCollection(landCoverLayer, simplifyOptions);

  return fc.features.reduce((objects: THREE.Object3D[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      const material = new THREE.MeshBasicMaterial({
        color: LandCoverClassColorMap[feature.properties['class'] as LandCoverFeatureClass].toThreeJsColor(),
      });

      const shape = new THREE.Shape();
      shape.moveTo(area[0][0], area[0][1]);
      for (let i = 1; i < area.length; i++) {
        shape.lineTo(area[i][0], area[i][1]);
      }

      const geometry = new THREE.ShapeGeometry(shape, 12);
      // geometry.center();
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geometry, material));
      group.translateX(x);
      group.translateY(y);
      group.scale.set(scale[0], scale[1], 1);

      objects.push(group);
    }

    return objects;
  }, [] as THREE.Object3D[]);
}

const boundaryMaterial = new THREE.LineBasicMaterial({
  color: BOUNDARY_COLOR.toThreeJsColor(),
  linewidth: 3,
});

export const getBoundaryThreeJsObjects = (
  boundaryLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): THREE.Object3D[] => {
  const fc = getBoundaryFeatureCollection(boundaryLayer, simplifyOptions);

  return fc.features.reduce((objects: THREE.Object3D[], feature: Feature) => {
    for (const lineStrip of (feature.geometry as Polygon).coordinates) {
      const points: THREE.Vector3[] = [];
      
      for (const point of lineStrip) {
        points.push(new THREE.Vector3(point[0], point[1], 0));
      }
  
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      // geometry.center();
      const line = new THREE.Line(geometry, boundaryMaterial);
  
      line.translateX(x);
      line.translateY(y);
      line.scale.set(scale[0], scale[1], 1);

      objects.push(line);
    }

    return objects;
  }, [] as THREE.Object3D[]);
}

const transportationMaterial = new THREE.LineBasicMaterial({
  color: TRANSPORTATION_COLOR.toThreeJsColor(),
  linewidth: 3,
});
export const getTransportationThreeJsObjects = (
  transportationLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
  reproject: (point: [number, number]) => [number, number],
): THREE.Object3D[] => {
  const fc = getTransportationFeatureCollection(transportationLayer, simplifyOptions);

  return fc.features.map((feature: Feature) => {
    const points: THREE.Vector3[] = [];

    for (const point of (feature.geometry as LineString).coordinates) {
      const [x, y] = reproject(point as [number, number]);
      points.push(new THREE.Vector3(x, y, 0));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // geometry.center();
    const line = new THREE.Line(geometry, transportationMaterial);

    // line.translateX(x);
    // line.translateY(y);
    // line.scale.set(scale[0], scale[1], 1);

    return line;
  });
}

export const getBuildingThreeJsObjects = (
  buildingLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): THREE.Object3D[] => {
  return [];
}