import { DataLayerStyle, FeatureStyle, FeatureStyleType } from './styles';
import { ContextLike } from './style_statement';
import { compileStatement, isStatement } from './style_statement_utils';

export function compileLayerStyle(style: DataLayerStyle, context: ContextLike): DataLayerStyle {
  const newStyleObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (key === 'background' && isFeatureStyle(value)) {
      newStyleObject[key] = compileFeatureStyle(value, context);
    } else if (isStatement(value)) {
      newStyleObject[key] = compileStatement(value, context);
    } else {
      newStyleObject[key] = value;
    }
  }

  return newStyleObject as DataLayerStyle;
}

export function compileFeatureStyle(featureStyle: FeatureStyle, context: ContextLike): FeatureStyle {
  const newStyleObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(featureStyle)) {
    if (isFeatureStyle(value)) {
      newStyleObject[key] = compileFeatureStyle(value, context);
    } else if (isStatement(value)) {
      newStyleObject[key] = compileStatement(value, context);
    } else {
      newStyleObject[key] = value;
    }
  }

  return newStyleObject as FeatureStyle;
}

export function isFeatureStyle(featureStyle: unknown): boolean {
  if (!featureStyle || !(featureStyle as FeatureStyle).type) {
    return false;
  }

  return [
    FeatureStyleType.point,
    FeatureStyleType.line,
    FeatureStyleType.polygon,
    FeatureStyleType.text,
    FeatureStyleType.image,
    FeatureStyleType.background,
  ].includes((featureStyle as FeatureStyle).type);
}
