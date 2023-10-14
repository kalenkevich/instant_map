export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  paint: DataLayerPaint;
  hide?: PaintStatement<boolean>;
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

export type PaintStatement<V> = IfStatement<V> | SwitchCaseStatement<V> | ValueStatement<V>;

export type IfStatement<V> = ['$if', ConditionStatement<V>, IfStatementFork<V>, IfStatementFork<V>?];

export type IfStatementFork<V> = IfStatement<V> | FeatureValue<V> | ConstantValue<V>;

export type SwitchCaseStatement<V> = [
  '$switch',
  ValueStatement<V>,
  ...Array<CasePaintStatement<V> | DefaultCasePaintStatement<V>>
];

export type CasePaintStatement<V> = [ValueStatement<V>, ValueStatement<V>];

export type DefaultCasePaintStatement<V> = ['$default', ValueStatement<V>];

export type ValueStatement<V> = FeatureValue<V> | ConstantValue<V>;

export type FeatureValue<V> = ['$get', string]; // object getter

export type ConstantValue<V> = V;

export type ConditionStatement<V> =
  | ValueStatement<V>
  | EqualCondition<V>
  | NotEqualCondition<V>
  | LessCondition<V>
  | LessOrEqualCondition<V>
  | GreaterCondition<V>
  | GreaterOrEqualCondition<V>
  | OrCondition<V>
  | AndCondition<V>;

export type EqualCondition<V> = ['$==' | '$eq', ConditionStatement<V>, ConditionStatement<V>];

export type NotEqualCondition<V> = ['$!=' | '$neq', ConditionStatement<V>, ConditionStatement<V>];

export type LessCondition<V> = ['$<' | '$lt', ConditionStatement<V>, ConditionStatement<V>];

export type LessOrEqualCondition<V> = ['$<=' | '$lte', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterCondition<V> = ['$>' | '$gt', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterOrEqualCondition<V> = ['$>=' | '$gte', ConditionStatement<V>, ConditionStatement<V>];

export type OrCondition<V> = ['$||' | '$or', ConditionStatement<V>, ConditionStatement<V>];

export type AndCondition<V> = ['$&&' | '$and', ConditionStatement<V>, ConditionStatement<V>];
