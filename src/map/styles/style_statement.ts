export type ContextLike = {
  [prop: string]: any;
};

export type Statement<V> = IfStatement<V> | SwitchCaseStatement<V> | ConditionStatement<V> | ValueStatement<V>;

export type IfStatement<V> = ['$if', ConditionStatement<V>, Statement<V>, Statement<V>?];

export type SwitchCaseStatement<V> = [
  '$switch',
  ValueStatement<V>,
  ...Array<CasePaintStatement<V> | DefaultCasePaintStatement<V>>
];

export type CasePaintStatement<V> = [ValueStatement<any>, Statement<V>];

export type DefaultCasePaintStatement<V> = ['$default', Statement<V>];

export type ValueStatement<V> = FeatureValue<V> | ConstantValue<V> | ColorValue;

export type FeatureValue<V> = ['$get', string]; // object getter

export type ConstantValue<V> = V;

export type ConditionStatement<V> =
  | ValueStatement<V>
  | NegativeStatement<V>
  | EqualCondition<V>
  | NotEqualCondition<V>
  | LessCondition<V>
  | LessOrEqualCondition<V>
  | GreaterCondition<V>
  | GreaterOrEqualCondition<V>
  | OrCondition<V>
  | AndCondition<V>
  | OneOfCondition<V>
  | HasCondition<V>;

export type NegativeStatement<V> = ['$!', ConditionStatement<any>];

export type EqualCondition<V> = ['$==' | '$eq', ConditionStatement<any>, ConditionStatement<any>];

export type NotEqualCondition<V> = ['$!=' | '$neq', ConditionStatement<V>, ConditionStatement<V>];

export type LessCondition<V> = ['$<' | '$lt', ConditionStatement<V>, ConditionStatement<V>];

export type LessOrEqualCondition<V> = ['$<=' | '$lte', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterCondition<V> = ['$>' | '$gt', ConditionStatement<V>, ConditionStatement<V>];

export type GreaterOrEqualCondition<V> = ['$>=' | '$gte', ConditionStatement<V>, ConditionStatement<V>];

export type OrCondition<V> = ['$||' | '$or', ConditionStatement<V>, ConditionStatement<V>];

export type AndCondition<V> = ['$&&' | '$and', ConditionStatement<any>, ConditionStatement<any>];

export type OneOfCondition<V> = ['$oneOf', ValueStatement<any>, ...Array<ValueStatement<any>>];

export type HasCondition<V> = ['$has', string];

export type ColorValue = RGBColorValue | RGBAColorValue;

export type RGBColorValue = ['$rgb', number, number, number];

export type RGBAColorValue = ['$rgba', number, number, number, number];
