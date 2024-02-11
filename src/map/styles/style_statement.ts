export type ContextLike = {
  [prop: string]: any;
};

export type Statement<V> =
  | IfStatement<V>
  | SwitchCaseStatement<V>
  | ConditionStatement
  | MathStatement
  | ValueStatement<V>;

export type IfStatement<V> = ['$if', ConditionStatement, Statement<V>, Statement<V>?];

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

// Condition (boolean) statements

export type ConditionStatement =
  | ValueStatement<any>
  | NegativeStatement
  | EqualCondition
  | NotEqualCondition
  | LessCondition
  | LessOrEqualCondition
  | GreaterCondition
  | GreaterOrEqualCondition
  | OrCondition
  | AndCondition
  | OneOfCondition
  | HasCondition
  | IsEmptyCondition
  | IsNotEmptyCondition;

export type NegativeStatement = ['$!', ConditionStatement];

export type EqualCondition = ['$==' | '$eq', ConditionStatement, ConditionStatement];

export type NotEqualCondition = ['$!=' | '$neq', ConditionStatement, ConditionStatement];

export type LessCondition = ['$<' | '$lt', ConditionStatement, ConditionStatement];

export type LessOrEqualCondition = ['$<=' | '$lte', ConditionStatement, ConditionStatement];

export type GreaterCondition = ['$>' | '$gt', ConditionStatement, ConditionStatement];

export type GreaterOrEqualCondition = ['$>=' | '$gte', ConditionStatement, ConditionStatement];

export type OrCondition = ['$||' | '$or', ConditionStatement, ConditionStatement];

export type AndCondition = ['$&&' | '$and', ConditionStatement, ConditionStatement];

export type OneOfCondition = ['$oneOf', ValueStatement<any>, ...Array<ValueStatement<any>>];

export type HasCondition = ['$has', string];

export type IsEmptyCondition = ['$empty', Statement<any>];

export type IsNotEmptyCondition = ['$notEmpty', Statement<any>];

// Color statements

export type ColorValue = RGBColorValue | RGBAColorValue;
export type RGBColorValue = ['$rgb', number, number, number];
export type RGBAColorValue = ['$rgba', number, number, number, number];

// Math statements
export type MathStatement =
  | PlusStatement
  | MinusStatement
  | MultiplyStatement
  | DivisionStatement
  | PowerStatement
  | SqrtStatement
  | AbsStatement
  | FloorStatement
  | CeilStatement
  | RoundStatement
  | ExpStatement
  | SinStatement
  | CosStatement
  | TanStatement
  | CtgStatement
  | LogStatement
  | Log2Statement
  | Log10Statement
  | MinStatement
  | MaxStatement
  | RandomStatement;

export type PlusStatement = ['$+', Statement<number>, Statement<number>];

export type MinusStatement = ['$-', Statement<number>, Statement<number>];

export type MultiplyStatement = ['$*', Statement<number>, Statement<number>];

export type DivisionStatement = ['$/', Statement<number>, Statement<number>];

export type PowerStatement = ['$pow', Statement<number>, Statement<number>];

export type SqrtStatement = ['$sqrt', Statement<number>];

export type AbsStatement = ['$abs', Statement<number>];

export type FloorStatement = ['$floor', Statement<number>];

export type CeilStatement = ['$ceil', Statement<number>];

export type RoundStatement = ['$round', Statement<number>];

export type ExpStatement = ['$exp', Statement<number>];

export type SinStatement = ['$sin', Statement<number>];

export type CosStatement = ['$cos', Statement<number>];

export type TanStatement = ['$tan', Statement<number>];

export type CtgStatement = ['$ctg', Statement<number>];

export type LogStatement = ['$log', Statement<number>];

export type Log2Statement = ['$log2', Statement<number>];

export type Log10Statement = ['$log10', Statement<number>];

// random(from: number = 0, to: number = 1): number;
export type RandomStatement = ['$random', Statement<number>?, Statement<number>?];

export type MinStatement = ['$min', Statement<number>, Statement<number>];

export type MaxStatement = ['$max', Statement<number>, Statement<number>];
