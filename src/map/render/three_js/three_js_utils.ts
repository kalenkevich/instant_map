import { Point, Polygon, MultiLineString } from 'geojson';
import {
  Object3D,
  Vector2,
  Line,
  Group,
  Mesh,
  Shape,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PlaneGeometry,
  CircleGeometry,
  ShapeGeometry,
  BufferGeometry,
  Color,
  BackSide,
  SRGBColorSpace,
} from 'three';
import { MapState } from '../../map_state';
import { TileLayer } from '../../tile/tile_layer';
import { ColorValue } from '../../styles/style_statement';
import { compileStatement } from '../../styles/style_statement_utils';
import { TileFeature } from '../../tile/tile_feature';
import { LineStyle, PointStyle, FeatureStyleType } from '../../styles/styles';

export interface LayerObjectsProps {
  layer: TileLayer;
  mapState: MapState;
  x: number;
  y: number;
  scale: [number, number];
  width: number;
  height: number;
  image?: HTMLImageElement;
}

export const THREEJS_COLOR_WHITE = new Color(0xffffff);
export const THREEJS_COLOR_BLACK = new Color(0x000000);
export const THREEJS_COLOR_GREY = new Color(0x808080);

export const getLayerObjects = (props: LayerObjectsProps): Object3D[] => {
  if (!props.layer.shouldBeRendered(props.mapState)) {
    return [];
  }

  const objects: Object3D[] = [];
  const backgroundObject = getLayerBackground(props);

  if (backgroundObject) {
    objects.push(backgroundObject);
  }

  for (const feature of props.layer.getFeatures()) {
    const featureObjects = getFeatureObjects(feature, props);

    if (featureObjects) {
      objects.push(...featureObjects);
    }
  }

  return objects;
};

export const getFeatureObjects = (feature: TileFeature, props: LayerObjectsProps): Object3D[] => {
  const featureStyle = feature.getStyles();

  if (!feature.shouldBeRendered(props.mapState) || !featureStyle) {
    return [];
  }

  switch (featureStyle.type) {
    case FeatureStyleType.point:
      return getPointFeatureObjects(feature, props);
    case FeatureStyleType.line:
      return getLineFeatureObjects(feature, props);
    case FeatureStyleType.polygon:
      return getPolygonFeatureObjects(feature, props);
    case FeatureStyleType.image:
      return getImageFeatureObjects(feature, props);
    case FeatureStyleType.text:
    default:
      console.info(`${featureStyle.type} is not supported by ThreeJs rendrer.`);
      return [];
  }
};

export const getPointFeatureObjects = (feature: TileFeature, props: LayerObjectsProps): Object3D[] => {
  const featureStyle = feature.getStyles()! as PointStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const radius = featureStyle.radius ? compileStatement(featureStyle.radius, geojsonFeature) : 50;
  const color = featureStyle.color
    ? getThreeJsColor(compileStatement(featureStyle.color, geojsonFeature))
    : THREEJS_COLOR_WHITE;
  const center = feature.getGeometry() as Point;
  const objects: Object3D[] = [];

  if (featureStyle.border) {
    const borderStyle = featureStyle.border;
    const borderRadius = radius + (featureStyle.radius ? compileStatement(borderStyle.width, geojsonFeature) : 5) * 2;
    const borderColor = borderStyle.color
      ? getThreeJsColor(compileStatement(borderStyle.color, geojsonFeature))
      : THREEJS_COLOR_BLACK;

    const geometry = new CircleGeometry(borderRadius, 32);
    const material = new MeshBasicMaterial({ color: borderColor });
    const borderCircle = new Mesh(geometry, material);

    borderCircle.translateX(props.x);
    borderCircle.translateY(props.y);
    borderCircle.scale.set(props.scale[0], props.scale[1], 1);
    borderCircle.position.set(center.coordinates[0], center.coordinates[1], 1);

    objects.push(borderCircle);
  }

  const geometry = new CircleGeometry(radius, 32);
  const material = new MeshBasicMaterial({ color });
  const circle = new Mesh(geometry, material);

  circle.translateX(props.x);
  circle.translateY(props.y);
  circle.scale.set(props.scale[0], props.scale[1], 1);
  circle.position.set(center.coordinates[0], center.coordinates[1], 1);

  objects.push(circle);

  return objects;
};

export const getLineFeatureObjects = (feature: TileFeature, props: LayerObjectsProps): Object3D[] => {
  const featureStyle = feature.getStyles()! as LineStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const lineWidth = featureStyle.width ? compileStatement(featureStyle.width, geojsonFeature) : 1;
  const color = featureStyle.color
    ? getThreeJsColor(compileStatement(featureStyle.color, geojsonFeature))
    : THREEJS_COLOR_BLACK;

  const objects: Line[] = [];

  const material = new LineBasicMaterial({
    color,
    linewidth: 1,
  });

  for (const line of (feature.getGeometry() as MultiLineString).coordinates) {
    const points: Vector2[] = [];

    for (const point of line) {
      points.push(new Vector2(point[0], point[1]));
    }

    const geometry = new BufferGeometry().setFromPoints(points);
    const lineObject = new Line(geometry, material);

    lineObject.translateX(props.x);
    lineObject.translateY(props.y);
    lineObject.scale.set(props.scale[0], props.scale[1], 1);

    objects.push(lineObject);
  }

  return objects;
};

export const getPolygonFeatureObjects = (feature: TileFeature, props: LayerObjectsProps): Object3D[] => {
  const featureStyle = feature.getStyles()! as LineStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const color = featureStyle.color
    ? getThreeJsColor(compileStatement(featureStyle.color, geojsonFeature))
    : THREEJS_COLOR_BLACK;

  const objects: Object3D[] = [];

  for (const area of (feature.getGeometry() as Polygon).coordinates) {
    const material = new MeshPhongMaterial({
      emissive: color,
      side: BackSide,
      flatShading: true,
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
    group.translateX(props.x);
    group.translateY(props.y);
    group.scale.set(props.scale[0], props.scale[1], 1);

    objects.push(group);
  }

  return objects;
};

// TODO support images
export const getImageFeatureObjects = (feature: TileFeature, props: LayerObjectsProps): Object3D[] => {
  return [];
};

export const getLayerBackground = (props: LayerObjectsProps): Object3D | undefined => {
  const backgroundStyle = props.layer.getStyles().background;
  if (!backgroundStyle || !backgroundStyle.color) {
    return;
  }

  const color = backgroundStyle.color
    ? getThreeJsColor(compileStatement(backgroundStyle.color, props.layer))
    : THREEJS_COLOR_GREY;
  const geometry = new PlaneGeometry(props.width, props.height);
  const material = new MeshBasicMaterial({ color, side: BackSide });
  const rectangle = new Mesh(geometry, material);

  rectangle.translateX(props.x);
  rectangle.translateY(props.y);
  rectangle.scale.set(props.scale[0], props.scale[1], 1);

  return rectangle;
};

// TODO support alpha channel.
export const getThreeJsColor = (stylesColor: ColorValue): Color => {
  const color = new Color();

  if (stylesColor[0] === '$rgb' || stylesColor[0] === '$rgba') {
    color.setRGB(stylesColor[1] / 255, stylesColor[2] / 255, stylesColor[3] / 255, SRGBColorSpace);
  }

  return color;
};
