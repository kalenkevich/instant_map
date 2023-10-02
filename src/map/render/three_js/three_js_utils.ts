import { Object3D, BackSide, MeshPhongMaterial, ShapeGeometry, Group, Mesh, Shape, LineBasicMaterial, BufferGeometry, Line, Vector2 } from 'three';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline';
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
): Object3D[] => {
  const fc = getWaterFeatureCollection(waterLayer, simplifyOptions);

  return fc.features.reduce((objects: Object3D[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      const material = new MeshPhongMaterial({
        emissive: WaterFeatureClassColorMap[feature.properties['class'] as WaterFeatureClass].toThreeJsColor(),
        side: BackSide,
        flatShading: true
      });

      const shape = new Shape();
      shape.moveTo(area[0][0], area[0][1]);
      for (let i = 1; i < area.length; i++) {
        shape.lineTo(area[i][0], area[i][1]);
      }

      const geometry = new ShapeGeometry(shape, 12);

      geometry.computeBoundingBox();

      const group = new Group();
      group.add(new Mesh(geometry, material));
      group.translateX(x);
      group.translateY(y);
      group.scale.set(scale[0], scale[1], 1);

      objects.push(group);
    }

    return objects;
  }, [] as Object3D[]);
}

export const getLandCoverThreeJsObjects = (
  landCoverLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Object3D[] => {

  const fc = getLandCoverFeatureCollection(landCoverLayer, simplifyOptions);

  return fc.features.reduce((objects: Object3D[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      const material = new MeshPhongMaterial({
        emissive: LandCoverClassColorMap[feature.properties['class'] as LandCoverFeatureClass].toThreeJsColor(),
        side: BackSide,
        flatShading: true
      });

      const shape = new Shape();
      shape.moveTo(area[0][0], area[0][1]);
      for (let i = 1; i < area.length; i++) {
        shape.lineTo(area[i][0], area[i][1]);
      }

      const geometry = new ShapeGeometry(shape, 12);
      const group = new Group();
      group.add(new Mesh(geometry, material));
      group.translateX(x);
      group.translateY(y);
      group.scale.set(scale[0], scale[1], 1);

      objects.push(group);
    }

    return objects;
  }, [] as Object3D[]);
}

const boundaryMaterial = new LineBasicMaterial({
  color: BOUNDARY_COLOR.toThreeJsColor(),
  linewidth: 3,
});

export const getBoundaryThreeJsObjects = (
  boundaryLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Object3D[] => {
  const fc = getBoundaryFeatureCollection(boundaryLayer, simplifyOptions);

  return fc.features.reduce((objects: Object3D[], feature: Feature) => {
    for (const lineStrip of (feature.geometry as Polygon).coordinates) {
      const points: Vector2[] = [];
      
      for (const point of lineStrip) {
        points.push(new Vector2(point[0], point[1]));
      }
  
      const geometry = new BufferGeometry().setFromPoints(points);
      const line = new Line(geometry, boundaryMaterial);
  
      line.translateX(x);
      line.translateY(y);
      line.scale.set(scale[0], scale[1], 1);

      objects.push(line);
    }

    return objects;
  }, [] as Object3D[]);
}


export const getTransportationThreeJsObjects = (
  transportationLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  mapWidth: number,
  mapHeight: number,
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Object3D[] => {
  const fc = getTransportationFeatureCollection(transportationLayer, simplifyOptions);

  return fc.features.map((feature: Feature) => {
    const points: Vector2[] = [];

    for (const point of (feature.geometry as LineString).coordinates) {
      points.push(new Vector2(point[0], point[1]));
    }

    const material = new LineBasicMaterial({
      color: TRANSPORTATION_COLOR.toThreeJsColor(),
      linewidth: 1,
    });
    const geometry = new BufferGeometry().setFromPoints(points);
    const line = new Line(geometry, material);

    line.translateX(x);
    line.translateY(y);
    line.scale.set(scale[0], scale[1], 1);

    return line;
  });

  // return fc.features.map((feature: Feature) => {
  //   const points: Vector2[] = [];

  //   for (const point of (feature.geometry as LineString).coordinates) {
  //     points.push(new Vector2(point[0], point[1]));
  //   }

  //   const geometry = new MeshLineGeometry();
  //   geometry.setPoints(points)
  //   const material = new MeshLineMaterial({
  //     color: TRANSPORTATION_COLOR.toThreeJsColor(),
  //     lineWidth: 1,
  //     resolution: new Vector2(mapWidth, mapHeight),
  //   })
  //   const mesh = new Mesh(geometry, material)

  //   mesh.translateX(x);
  //   mesh.translateY(y);
  //   mesh.scale.set(scale[0], scale[1], 1);
  //   mesh.raycast = raycast;

  //   return mesh;
  // });
}

const buildingMaterial = new MeshPhongMaterial({
  color: 0x156289,
  emissive: BUILDING_COLOR.toThreeJsColor(),
  side: BackSide,
  flatShading: true
});
export const getBuildingThreeJsObjects = (
  buildingLayer: TileLayer,
  x: number,
  y: number,
  scale: [number, number],
  simplifyOptions: SipmlifyGeometryOptions = DefaultSipmlifyGeometryOptions,
): Object3D[] => {
  const fc = getBuildingFeatureCollection(buildingLayer, simplifyOptions);

  return fc.features.reduce((objects: Object3D[], feature: Feature) => {
    for (const area of (feature.geometry as Polygon).coordinates) {
      const shape = new Shape();
      shape.moveTo(area[0][0], area[0][1]);
      for (let i = 1; i < area.length; i++) {
        shape.lineTo(area[i][0], area[i][1]);
      }

      const geometry = new ShapeGeometry(shape, 12);
      const group = new Group();
      group.add(new Mesh(geometry, buildingMaterial));
      group.translateX(x);
      group.translateY(y);
      group.scale.set(scale[0], scale[1], 1);

      objects.push(group);
    }

    return objects;
  }, [] as Object3D[]);
}