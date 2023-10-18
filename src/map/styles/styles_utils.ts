import { DataLayerStyle, DataLayerPaint, DataLayerPaintType } from './styles';
import { ContextLike } from './style_statement';
import { compileStatement, isStatement } from './style_statement_utils';

export function compileStyle(style: DataLayerStyle, feature: ContextLike): DataLayerStyle {
  const newStyleObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (isPaint(value)) {
      newStyleObject[key] = compilePaint(value, feature);
    } else {
      newStyleObject[key] = value;
    }
  }

  return newStyleObject as DataLayerStyle;
}

export function compilePaint(paint: DataLayerPaint, feature: ContextLike): DataLayerPaint {
  const newPaintObject: Record<string, any> = {};

  for (const [key, value] of Object.entries(paint)) {
    if (isStatement(value)) {
      newPaintObject[key] = compileStatement(value, feature);
    } else {
      newPaintObject[key] = value;
    }
  }

  return newPaintObject as DataLayerPaint;
}

export function isPaint(paint: DataLayerPaint): boolean {
  return [
    DataLayerPaintType.line,
    DataLayerPaintType.polygon,
    DataLayerPaintType.text,
    DataLayerPaintType.image,
    DataLayerPaintType.background,
  ].includes(paint.type);
}
