export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  paint: DataLayerPaint;
  hide?: boolean;
  minzoom?: number;
  maxzoom?: number;
  background?: DataLayerBackground;
}

export interface DataLayerBackground {
  color?: PaintStatement<string>; // default white
  opacity?: PaintStatement<number>; // from 0..1
}

export type DataLayerPaint = LinePaint | PolygonPaint | TextPaint | ImagePaint;

export interface LinePaint {
  type: 'line';
  color: PaintStatement<string>;
  width?: PaintStatement<number>; // default 1
  opacity?: PaintStatement<number>; // from 0..1
}

export interface PolygonPaint {
  type: 'polygon'; // <- polygon
  color: PaintStatement<string>;
  opacity?: PaintStatement<number>; // from 0..1
}

export interface TextPaint {
  type: 'text';
  color: PaintStatement<string>;
  font: PaintStatement<string>;
  fontSize: PaintStatement<number>;
  opacity?: PaintStatement<number>; // from 0..1
}

export interface ImagePaint {
  type: 'image';
  width: PaintStatement<number>;
  height: PaintStatement<number>;
  opacity?: PaintStatement<number>; // from 0..1
}

export type PaintStatement<V> = IfPaintStatement<V> | SwitchCasePaintStatement<V> | ValueStatement<V>;

export type IfPaintStatement<V> = ['$if', ConditionPaintStatement, IfStatementFork<V>, IfStatementFork<V>?];

export type IfStatementFork<V> = IfPaintStatement<V> | FeatureValue | ConstantValue<V>;

export type SwitchCasePaintStatement<V> = ['$switch', ValueStatement<V>, ...Array<CasePaintStatement<V> | DefaultCasePaintStatement<V>>];

export type CasePaintStatement<V> = [ValueStatement<V>, ValueStatement<V>];

export type DefaultCasePaintStatement<V> = ['$default', ValueStatement<V>];

export type ValueStatement<V> = FeatureValue | ConstantValue<V>;

export type FeatureValue = ['$get', string];

export type ConstantValue<V> = V;

export type ConditionPaintStatement =
  | ValueStatement<boolean>
  | EqualCondition
  | NotEqualCondition
  | LessCondition
  | LessOrEqualCondition
  | GreaterCondition
  | GreaterOrEqualCondition
  | OrCondition
  | AndCondition;

export type EqualCondition = ['$==' | '$eq', ConditionPaintStatement, ConditionPaintStatement];

export type NotEqualCondition = ['$!=' | '$neq', ConditionPaintStatement, ConditionPaintStatement];

export type LessCondition = ['$<' | '$lt', ConditionPaintStatement, ConditionPaintStatement];

export type LessOrEqualCondition = ['$<=' | '$lte', ConditionPaintStatement, ConditionPaintStatement];

export type GreaterCondition = ['$>' | '$gt', ConditionPaintStatement, ConditionPaintStatement];

export type GreaterOrEqualCondition = ['$>=' | '$gte', ConditionPaintStatement, ConditionPaintStatement];

export type OrCondition = ['$||' | '&or', ConditionPaintStatement, ConditionPaintStatement];

export type AndCondition = ['$&&' | '&and', ConditionPaintStatement, ConditionPaintStatement];
