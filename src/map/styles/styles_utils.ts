import { DataLayerStyle, FeatureStyle, FeatureStyleType } from './styles';
import { ContextLike } from './style_statement';
import { compileStatement, isStatement } from './style_statement_utils';

export function compileLayerStyle(style: DataLayerStyle, feature: ContextLike): DataLayerStyle {
  const newStyleObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (isFeatureStyle(value)) {
      newStyleObject[key] = compileFeatureStyle(value, feature);
    } else {
      newStyleObject[key] = value;
    }
  }

  return newStyleObject as DataLayerStyle;
}

export function compileFeatureStyle(paint: FeatureStyle, feature: ContextLike): FeatureStyle {
  const newPaintObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(paint)) {
    if (isStatement(value)) {
      newPaintObject[key] = compileStatement(value, feature);
    } else {
      newPaintObject[key] = value;
    }
  }

  return newPaintObject as FeatureStyle;
}

export function isFeatureStyle(paint: FeatureStyle): boolean {
  return [
    FeatureStyleType.line,
    FeatureStyleType.polygon,
    FeatureStyleType.text,
    FeatureStyleType.image,
    FeatureStyleType.background,
  ].includes(paint.type);
}
