export type DataTileStyles = Record<string, DataLayerStyle>;

export interface DataLayerStyle {
  styleLayerName: string; // style layer name;
  sourceLayerName: string; // tile feature layer;
  paint: DataLayerPaint;
  hide?: Statement<boolean>;
  minzoom?: number;
  maxzoom?: number;
  background?: DataLayerBackground;
}

export interface DataLayerBackground {
  color?: Statement<string>; // default white
  opacity?: Statement<number>; // from 0..1
}

export type DataLayerPaint = LinePaint | PolygonPaint | TextPaint | ImagePaint;

export interface LinePaint {
  type: 'line';
  color: Statement<string>;
  width?: Statement<number>; // default 1
  opacity?: Statement<number>; // from 0..1
}

export interface PolygonPaint {
  type: 'polygon'; // <- polygon
  color: Statement<string>;
  opacity?: Statement<number>; // from 0..1
}

export interface TextPaint {
  type: 'text';
  color: Statement<string>;
  font: Statement<string>;
  fontSize: Statement<number>;
  opacity?: Statement<number>; // from 0..1
}

export interface ImagePaint {
  type: 'image';
  width: Statement<number>;
  height: Statement<number>;
  opacity?: Statement<number>; // from 0..1
}

export type Statement<V> = IfStatement<V> | SwitchCaseStatement<V> | ValueStatement<V>;

export type IfStatement<V> = ['$if', ConditionStatement<V>, Statement<V>, Statement<V>?];

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
  | AndCondition<V>
  | OneOfCondition<V>;

export type EqualCondition<V> = ['$==' | '$eq', ConditionStatement<V>, ConditionStatement<V>];

export type NotEqualCondition<V> = ['$!=' | '$neq', ConditionStatement<V>, ConditionStatement<V>];

export type LessCondition<V> = ['$<' | '$lt', ConditionStatement<V>, ConditionStatement<V>];

export type LessOrEqualCondition<V> = ['$<=' | '$lte', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterCondition<V> = ['$>' | '$gt', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterOrEqualCondition<V> = ['$>=' | '$gte', ConditionStatement<V>, ConditionStatement<V>];

export type OrCondition<V> = ['$||' | '$or', ConditionStatement<V>, ConditionStatement<V>];

export type AndCondition<V> = ['$&&' | '$and', ConditionStatement<V>, ConditionStatement<V>];

export type OneOfCondition<V> = ['$oneOf', ValueStatement<V>, ...Array<ValueStatement<V>>];
