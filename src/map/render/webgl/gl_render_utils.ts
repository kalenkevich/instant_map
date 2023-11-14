import { Point } from 'geojson';
import { MapState } from '../../map_state';
import { TileLayer } from '../../tile/tile_layer';
import { ColorValue } from '../../styles/style_statement';
import { compileStatement } from '../../styles/style_statement_utils';
import { TileFeature } from '../../tile/tile_feature';
import { LineStyle, PointStyle, FeatureStyleType, TextStyle } from '../../styles/styles';
import { FontManager } from '../../font/font_manager';

import {
  v2,
  GlProgram,
  WebGlImage,
  WebGlRectangle,
  WebGlCircle,
  WebGlLineStrip,
  WebGlArea,
  WebGlText,
  GlLineStripProps,
  GlColor,
  GL_COLOR_WHITE,
  GL_COLOR_BLACK,
} from '../../../webgl';

export interface LayerGlProgramsProps {
  layer: TileLayer;
  mapState: MapState;
  x: number;
  y: number;
  scale: [number, number];
  width: number;
  height: number;
  image?: HTMLImageElement;
  fontManager: FontManager;
  devicePixelRatio: number;
}

export const getLayerGlPrograms = (props: LayerGlProgramsProps): GlProgram[] => {
  if (!props.layer.shouldBeRendered(props.mapState)) {
    return [];
  }

  const programs: GlProgram[] = [];
  const backgroundProgram = getLayerBackground(props);

  if (backgroundProgram) {
    programs.push(backgroundProgram);
  }

  for (const feature of props.layer.getFeatures()) {
    const featureGlGrograms = getFeatureGlPrograms(feature, props);

    if (featureGlGrograms.length) {
      programs.push(...featureGlGrograms);
    }
  }

  return programs;
};

export const getFeatureGlPrograms = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  const featureStyle = feature.getStyles();

  if (!feature.shouldBeRendered(props.mapState) || !featureStyle) {
    return [];
  }

  switch (featureStyle.type) {
    case FeatureStyleType.point:
      return getPointFeatureGlProgram(feature, props);
    case FeatureStyleType.line:
      return getLineFeatureGlProgram(feature, props);
    case FeatureStyleType.polygon:
      return getPolygonFeatureGlProgram(feature, props);
    case FeatureStyleType.image:
      return getImageFeatureGlProgram(feature, props);
    case FeatureStyleType.text:
      return getTextFeatureGlPrograms(feature, props);
    default:
      console.info(`${featureStyle.type} is not supported by WebGL rendrer.`);
      return [];
  }
};

export const getPointFeatureGlProgram = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  const featureStyle = feature.getStyles()! as PointStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const radius = featureStyle.radius ? compileStatement<number>(featureStyle.radius, geojsonFeature) : 50;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_WHITE;
  const center = feature.getGeometry() as Point;
  const programs: GlProgram[] = [];

  if (featureStyle.border) {
    const borderStyle = featureStyle.border;
    const borderRadius =
      radius + (featureStyle.radius ? compileStatement<number>(borderStyle.width, geojsonFeature) : 5) * 2;
    const borderColor = borderStyle.color
      ? getGlColor(compileStatement(borderStyle.color, geojsonFeature))
      : GL_COLOR_BLACK;

    programs.push(
      new WebGlCircle({
        components: 32,
        p: center.coordinates as v2,
        radius: borderRadius,
        color: borderColor,
        translation: [props.x, props.y],
        scale: props.scale,
      })
    );
  }

  programs.push(
    new WebGlCircle({
      components: 32,
      p: center.coordinates as v2,
      radius,
      color,
      translation: [props.x, props.y],
      scale: props.scale,
    })
  );

  return programs;
};

export const getLineFeatureGlProgram = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  const featureStyle = feature.getStyles()! as LineStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const lineWidth = featureStyle.width ? compileStatement<number>(featureStyle.width, geojsonFeature) : 1;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  const programs: GlProgram[] = [];
  for (const lineStrip of feature.getGeometry().coordinates) {
    const lineStripProps: GlLineStripProps = {
      color,
      lineWidth,
      points: lineStrip as v2[],
      translation: [props.x, props.y],
      scale: props.scale,
    };

    programs.push(new WebGlLineStrip(lineStripProps));
  }

  return programs;
};

export const getPolygonFeatureGlProgram = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  const geojsonFeature = feature.getGeoJsonFeature();
  if (geojsonFeature.geometry.type !== 'Polygon') {
    return [];
  }

  const featureStyle = feature.getStyles()! as LineStyle;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  const programs: GlProgram[] = [];

  for (const area of feature.getGeometry().coordinates) {
    programs.push(
      new WebGlArea({
        color,
        points: area as v2[],
        translation: [props.x, props.y],
        scale: props.scale,
      })
    );
  }

  return programs;
};

export const getImageFeatureGlProgram = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  return [
    new WebGlImage({
      width: props.width,
      height: props.height,
      image: props.image!,
      translation: [props.x, props.y],
      scale: props.scale,
    }),
  ];
};

export const getTextFeatureGlPrograms = (feature: TileFeature, props: LayerGlProgramsProps): GlProgram[] => {
  const featureStyle = feature.getStyles()! as TextStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const text = compileStatement<string>(featureStyle.text, geojsonFeature);

  if (!text) {
    return [];
  }

  const font = featureStyle.font ? compileStatement<string>(featureStyle.font, geojsonFeature) : 'roboto';
  const fontSize = featureStyle.fontSize ? compileStatement<number>(featureStyle.fontSize, geojsonFeature) : 14;
  const point = (feature.getGeometry() as Point).coordinates;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  return [
    new WebGlText({
      p: point as v2,
      text,
      font: props.fontManager.getFont(font),
      fontSize: fontSize * props.devicePixelRatio,
      color,
      translation: [props.x, props.y],
      scale: props.scale,
    }),
  ];
};

export const getLayerBackground = (props: LayerGlProgramsProps): GlProgram | undefined => {
  const backgroundStyle = props.layer.getStyles().background;
  if (!backgroundStyle || !backgroundStyle.color) {
    return;
  }

  return new WebGlRectangle({
    p: [0, 0],
    translation: [props.x, props.y],
    scale: props.scale,
    width: props.width,
    height: props.height,
    color: getGlColor(compileStatement(backgroundStyle.color, props.layer)),
  });
};

export const getGlColor = (stylesColor: ColorValue): GlColor => {
  if (stylesColor[0] === '$rgb') {
    return [stylesColor[1] / 255, stylesColor[2] / 255, stylesColor[3] / 255];
  }

  if (stylesColor[0] === '$rgba') {
    return [stylesColor[1] / 255, stylesColor[2] / 255, stylesColor[3] / 255, stylesColor[4]];
  }
};
