import {
  ContextLike,
  Statement,
  IfStatement,
  SwitchCaseStatement,
  ValueStatement,
  ConditionStatement,
  FeatureValue,
  ConstantValue,
  EqualCondition,
  NotEqualCondition,
  LessCondition,
  LessOrEqualCondition,
  GreaterCondition,
  GreaterOrEqualCondition,
  OrCondition,
  AndCondition,
  OneOfCondition,
  HasCondition,
  NegativeStatement,
  IsEmptyCondition,
  IsNotEmptyCondition,
  MathStatement,
  PlusStatement,
  MinusStatement,
  MultiplyStatement,
  DivisionStatement,
  PowerStatement,
  SqrtStatement,
  AbsStatement,
  FloorStatement,
  CeilStatement,
  RoundStatement,
  ExpStatement,
  SinStatement,
  CosStatement,
  TanStatement,
  CtgStatement,
  LogStatement,
  Log2Statement,
  Log10Statement,
  RandomStatement,
  MinStatement,
  MaxStatement,
  ColorValue,
  RGBColorValue,
  RGBAColorValue,
} from './style_statement';

export function isStatement(statement: unknown): boolean {
  if (!Array.isArray(statement) || typeof statement[0] !== 'string') {
    return false;
  }

  return (
    ['$if', '$switch', '$get'].includes(statement[0]) ||
    isColorStatement(statement) ||
    isConditionStatement(statement) ||
    isMathStatement(statement)
  );
}

export function compileStatement<V>(statement: Statement<V>, context: ContextLike): V {
  if (isConstantValue(statement)) {
    return compileConstantValueStatement(statement) as V;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement as FeatureValue<V>, context);
  }

  if (statement[0] === '$if') {
    return compileIfStatement<V>(statement as IfStatement<V>, context);
  }

  if (statement[0] === '$switch') {
    return compileSwitchCaseStatement<V>(statement as SwitchCaseStatement<V>, context);
  }

  if (isColorStatement(statement)) {
    return compileColorStatement(statement as RGBAColorValue) as V;
  }

  if (isConditionStatement(statement)) {
    return compileConditionStatement(statement, context) as V;
  }

  if (isMathStatement(statement)) {
    return compileMathStatement(statement as MathStatement, context) as V;
  }

  throw new Error('Statement is invalid: ' + JSON.stringify(statement));
}

export function compileIfStatement<V>(statement: IfStatement<V>, context: ContextLike): V | undefined {
  if (!Array.isArray(statement) || statement[0] !== '$if' || !(statement.length === 3 || statement.length === 4)) {
    throw new Error('If statement is invalid: ' + JSON.stringify(statement));
  }

  const conditionResult: boolean = compileConditionStatement(statement[1], context);
  const thenStatement = statement[2];
  const elseStatement = statement[3];

  if (conditionResult) {
    return compileStatement<V>(thenStatement, context);
  }

  if (elseStatement !== undefined) {
    return compileStatement<V>(elseStatement, context);
  }

  return undefined;
}

export function compileSwitchCaseStatement<V>(statement: SwitchCaseStatement<V>, context: ContextLike): V {
  if (!Array.isArray(statement) || statement[0] !== '$switch' || statement.length < 3) {
    throw new Error('Switch statement is invalid: ' + JSON.stringify(statement));
  }

  const [, switchValueStatement, ...caseStatements] = statement;
  const defaultStatementIndex = caseStatements.findIndex(s => s[0] === '$default');

  if (defaultStatementIndex !== -1 && defaultStatementIndex !== caseStatements.length - 1) {
    throw new Error('Switch statement is invalid, $default should be last case: ' + JSON.stringify(statement));
  }

  const switchValue = compileValueStatement(switchValueStatement, context);

  for (const caseStatement of caseStatements) {
    if (caseStatement[0] === '$default') {
      continue;
    }

    const caseValue = compileValueStatement(caseStatement[0], context);

    if (switchValue === caseValue) {
      return compileStatement(caseStatement[1], context);
    }
  }

  if (defaultStatementIndex !== -1) {
    const defaultStatement = caseStatements[defaultStatementIndex];

    return compileStatement(defaultStatement[1], context);
  }

  return undefined;
}

export function compileConditionStatementOrValue<V>(statement: ConditionStatement, context: ContextLike): V {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return statement as V;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Condition statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement as FeatureValue<V>, context);
  }

  return compileConditionStatement<V>(statement, context) as V;
}

export function isConditionStatement(statement: unknown): boolean {
  if (!Array.isArray(statement) || typeof statement[0] !== 'string') {
    return false;
  }

  return [
    '$!',
    '$eq',
    '$==',
    '$neq',
    '$!=',
    '$lt',
    '$<',
    '$lte',
    '$<=',
    '$gt',
    '$>',
    '$gte',
    '$>=',
    '$or',
    '$||',
    '$and',
    '$&&',
    '$oneOf',
    '$has',
    '$isEmpty',
    '$isNotEmpty',
  ].includes(statement[0]);
}

export function compileConditionStatement<V>(statement: ConditionStatement, context: ContextLike): boolean {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return !!statement;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Condition statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return !!compileFeatureValueStatement<boolean>(statement as FeatureValue<V>, context);
  }

  if (statement[0] === '$!') {
    return !!compileNegativeStatement(statement as NegativeStatement, context);
  }

  if (statement[0] === '$==' || statement[0] === '$eq') {
    return compileEqualCondition(statement as EqualCondition, context);
  }

  if (statement[0] === '$!=' || statement[0] === '$neq') {
    return compileNotEqualCondition(statement as NotEqualCondition, context);
  }

  if (statement[0] === '$<' || statement[0] === '$lt') {
    return compileLessCondition(statement as LessCondition, context);
  }

  if (statement[0] === '$<=' || statement[0] === '$lte') {
    return compileLessOrEqualCondition(statement as LessOrEqualCondition, context);
  }

  if (statement[0] === '$>' || statement[0] === '$gt') {
    return compileGreaterCondition(statement as GreaterCondition, context);
  }

  if (statement[0] === '$>=' || statement[0] === '$gte') {
    return compileGreaterOrEqualCondition(statement as GreaterOrEqualCondition, context);
  }

  if (statement[0] === '$||' || statement[0] === '$or') {
    return compileOrCondition(statement as OrCondition, context);
  }

  if (statement[0] === '$&&' || statement[0] === '$and') {
    return compileAndCondition(statement as AndCondition, context);
  }

  if (statement[0] === '$oneOf') {
    return compileOneOfCondition(statement as OneOfCondition, context);
  }

  if (statement[0] === '$has') {
    return compileHasCondition(statement as HasCondition, context);
  }

  if (statement[0] === '$empty') {
    return compileIsEmptyCondition(statement as IsEmptyCondition, context);
  }

  if (statement[0] === '$notEmpty') {
    return compileIsNotEmptyCondition(statement as IsNotEmptyCondition, context);
  }

  throw new Error('Unrecognised condition statement: ' + JSON.stringify(statement));
}

export function compileNegativeStatement(statement: NegativeStatement, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$!' || statement.length < 2) {
    throw new Error('NegativeStatement is invalid: ' + JSON.stringify(statement));
  }

  return !compileConditionStatement(statement[1], context);
}

export function compileEqualCondition(statement: EqualCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$==', '$eq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('EqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement === rightHandStatement;
}

export function compileNotEqualCondition(statement: NotEqualCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$!=', '$neq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('NotEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement !== rightHandStatement;
}

export function compileLessCondition(statement: LessCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$<', '$lt'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement < rightHandStatement;
}

export function compileLessOrEqualCondition(statement: LessOrEqualCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$<=', '$lte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement <= rightHandStatement;
}

export function compileGreaterCondition(statement: GreaterCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$>', '$gt'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement > rightHandStatement;
}

export function compileGreaterOrEqualCondition(statement: GreaterOrEqualCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$>=', '$gte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement >= rightHandStatement;
}

export function compileOrCondition(statement: OrCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$||', '$or'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('OrCondition statement is invalid: ' + JSON.stringify(statement));
  }

  if (compileConditionStatementOrValue(statement[1], context)) {
    return true;
  }

  return !!compileConditionStatementOrValue(statement[2], context);
}

export function compileAndCondition(statement: AndCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$&&', '$and'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('AndCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return !!(leftHandStatement && rightHandStatement);
}

export function compileValueStatement<V>(statement: ValueStatement<V>, context: ContextLike): V {
  if (Array.isArray(statement) && statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement, context);
  }

  if (isConstantValue(statement)) {
    return compileConstantValueStatement(statement) as V;
  }

  throw new Error('Value statement in invalid: ' + JSON.stringify(statement));
}

export function compileOneOfCondition(statement: OneOfCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$oneOf' || statement.length < 3) {
    throw new Error('OneOfCondition is invalid: ' + JSON.stringify(statement));
  }

  const [, val, ...valueStatements] = statement;
  const compiledVal = compileValueStatement(val, context);

  for (const valueStatement of valueStatements) {
    if (compiledVal === compileValueStatement(valueStatement, context)) {
      return true;
    }
  }

  return false;
}

export function compileHasCondition(statement: HasCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$has' || statement.length !== 2) {
    throw new Error('HasCondition is invalid: ' + JSON.stringify(statement));
  }

  return hasPropertyValue(context, statement[1]);
}

export function compileIsEmptyCondition(statement: IsEmptyCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$empty' || statement.length !== 2) {
    throw new Error('IsEmptyCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const value = compileStatement(statement[1], context);

  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    Object.keys(value).length === 0
  );
}

export function compileIsNotEmptyCondition(statement: IsNotEmptyCondition, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$notEmpty' || statement.length !== 2) {
    throw new Error('IsNotEmptyCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const value = compileStatement(statement[1], context);

  return !(
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    Object.keys(value).length === 0
  );
}

export function compileFeatureValueStatement<V>(statement: FeatureValue<V>, context: ContextLike): V {
  if (!Array.isArray(statement) || statement[0] !== '$get' || statement.length !== 2) {
    throw new Error('FeatureValue statement is invalid: ' + JSON.stringify(statement));
  }

  return getPropertyValue<V>(context, statement[1]);
}

export function compileConstantValueStatement<V>(statement: ConstantValue<V>): V {
  if (!isConstantValue(statement)) {
    throw new Error('Constant statement in invalid: ' + JSON.stringify(statement));
  }

  return statement as V;
}

export function isConstantValue<V>(statement: Statement<V>): boolean {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return true;
  }

  if (Array.isArray(statement) && typeof statement[0] === 'string') {
    return ![
      '$if',
      '$switch',
      '$get',
      '$eq',
      '$==',
      '$neq',
      '$!=',
      '$lt',
      '$<',
      '$lte',
      '$<=',
      '$gt',
      '$>',
      '$gte',
      '$>=',
      '$or',
      '$||',
      '$and',
      '$&&',
      '$oneOf',
      '$has',
      '$!',
      '$empty',
      '$notEmpty',
      '$+',
      '$-',
      '$*',
      '$/',
      '$pow',
      '$sqrt',
      '$abs',
      '$floor',
      '$ceil',
      '$round',
      '$exp',
      '$sin',
      '$cos',
      '$tan',
      '$ctg',
      '$log',
      '$log2',
      '$log10',
      '$random',
      '$min',
      '$max',
      '$rgb',
      '$rgba',
    ].includes(statement[0]);
  }

  return true;
}

export function hasPropertyValue(source: any, property?: string | number): boolean {
  if (property === undefined || property === null) {
    return false;
  }

  if (!['number', 'string'].includes(typeof property)) {
    throw new Error('Cannot get value from: ' + JSON.stringify(property));
  }

  let currentSource = source;
  const propertyPath = typeof property === 'string' ? property.split('.') : [`${property}`];

  for (const pathItem of propertyPath) {
    if (currentSource === null || currentSource == undefined) {
      return false;
    }

    try {
      if (pathItem in currentSource) {
        currentSource = currentSource[pathItem];
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  return true;
}

export function getPropertyValue<V>(source: any, property?: string | number): ConstantValue<V> {
  if (property === undefined || property === null) {
    return source;
  }

  if (!['number', 'string'].includes(typeof property)) {
    throw new Error('Cannot get value from: ' + JSON.stringify(property));
  }

  let currentSource = source;
  const propertyPath = typeof property === 'string' ? property.split('.') : [`${property}`];

  for (const pathItem of propertyPath) {
    if (currentSource === null || currentSource == undefined) {
      return currentSource;
    }

    try {
      if (pathItem in currentSource) {
        currentSource = currentSource[pathItem];
      } else {
        return undefined;
      }
    } catch (e) {
      return undefined;
    }
  }

  return currentSource;
}

export function isMathStatement(statement: unknown): boolean {
  if (!Array.isArray(statement) || typeof statement[0] !== 'string') {
    return false;
  }

  return [
    '$+',
    '$-',
    '$*',
    '$/',
    '$pow',
    '$sqrt',
    '$abs',
    '$floor',
    '$ceil',
    '$round',
    '$exp',
    '$sin',
    '$cos',
    '$tan',
    '$ctg',
    '$log',
    '$log2',
    '$log10',
    '$random',
    '$min',
    '$max',
  ].includes(statement[0]);
}

export function compileMathStatement(statement: MathStatement, context: ContextLike): number {
  if (!Array.isArray(statement)) {
    throw new Error('Math statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$+') {
    return compilePlusStatement(statement as PlusStatement, context);
  }

  if (statement[0] === '$-') {
    return compileMinusStatement(statement as MinusStatement, context);
  }

  if (statement[0] === '$*') {
    return compileMultiplyStatement(statement as MultiplyStatement, context);
  }

  if (statement[0] === '$/') {
    return compileDivisionStatement(statement as DivisionStatement, context);
  }

  if (statement[0] === '$pow') {
    return compilePowerStatement(statement as PowerStatement, context);
  }

  if (statement[0] === '$sqrt') {
    return compileSqrtStatement(statement as SqrtStatement, context);
  }

  if (statement[0] === '$abs') {
    return compileAbsStatement(statement as AbsStatement, context);
  }

  if (statement[0] === '$floor') {
    return compileFloorStatement(statement as FloorStatement, context);
  }

  if (statement[0] === '$ceil') {
    return compileCeilStatement(statement as CeilStatement, context);
  }

  if (statement[0] === '$round') {
    return compileRoundStatement(statement as RoundStatement, context);
  }

  if (statement[0] === '$exp') {
    return compileExpStatement(statement as ExpStatement, context);
  }

  if (statement[0] === '$sin') {
    return compileSinStatement(statement as SinStatement, context);
  }

  if (statement[0] === '$cos') {
    return compileCosStatement(statement as CosStatement, context);
  }

  if (statement[0] === '$tan') {
    return compileTanStatement(statement as TanStatement, context);
  }

  if (statement[0] === '$ctg') {
    return compileCtgStatement(statement as CtgStatement, context);
  }

  if (statement[0] === '$log') {
    return compileLogStatement(statement as LogStatement, context);
  }

  if (statement[0] === '$log2') {
    return compileLog2Statement(statement as Log2Statement, context);
  }

  if (statement[0] === '$log10') {
    return compileLog10Statement(statement as Log10Statement, context);
  }

  if (statement[0] === '$random') {
    return compileRandomStatement(statement as RandomStatement, context);
  }

  if (statement[0] === '$min') {
    return compileMinStatement(statement as MinStatement, context);
  }

  if (statement[0] === '$max') {
    return compileMaxStatement(statement as MaxStatement, context);
  }

  throw new Error('Unrecognised Math statement: ' + JSON.stringify(statement));
}

export function compilePlusStatement(statement: PlusStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$+' || statement.length !== 3) {
    throw new Error('PlusStatement is invalid: ' + JSON.stringify(statement));
  }

  return compileStatement<number>(statement[1], context) + compileStatement<number>(statement[2], context);
}

export function compileMinusStatement(statement: MinusStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$-' || statement.length !== 3) {
    throw new Error('MinusStatement is invalid: ' + JSON.stringify(statement));
  }

  return compileStatement<number>(statement[1], context) - compileStatement<number>(statement[2], context);
}

export function compileMultiplyStatement(statement: MultiplyStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$*' || statement.length !== 3) {
    throw new Error('MultiplyStatement is invalid: ' + JSON.stringify(statement));
  }

  return compileStatement<number>(statement[1], context) * compileStatement<number>(statement[2], context);
}

export function compileDivisionStatement(statement: DivisionStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$/' || statement.length !== 3) {
    throw new Error('DivisionStatement is invalid: ' + JSON.stringify(statement));
  }

  return compileStatement<number>(statement[1], context) / compileStatement<number>(statement[2], context);
}

export function compilePowerStatement(statement: PowerStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$pow' || statement.length !== 3) {
    throw new Error('PowerStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.pow(compileStatement<number>(statement[1], context), compileStatement<number>(statement[2], context));
}

export function compileSqrtStatement(statement: SqrtStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$sqrt' || statement.length !== 2) {
    throw new Error('SqrtStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.sqrt(compileStatement<number>(statement[1], context));
}

export function compileAbsStatement(statement: AbsStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$abs' || statement.length !== 2) {
    throw new Error('AbsStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.abs(compileStatement<number>(statement[1], context));
}

export function compileFloorStatement(statement: FloorStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$floor' || statement.length !== 2) {
    throw new Error('FloorStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.floor(compileStatement<number>(statement[1], context));
}

export function compileCeilStatement(statement: CeilStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$ceil' || statement.length !== 2) {
    throw new Error('CeilStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.ceil(compileStatement<number>(statement[1], context));
}

export function compileRoundStatement(statement: RoundStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$round' || statement.length !== 2) {
    throw new Error('RoundStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.round(compileStatement<number>(statement[1], context));
}

export function compileExpStatement(statement: ExpStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$exp' || statement.length !== 2) {
    throw new Error('ExpStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.exp(compileStatement<number>(statement[1], context));
}

export function compileSinStatement(statement: SinStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$sin' || statement.length !== 2) {
    throw new Error('SinStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.sin(compileStatement<number>(statement[1], context));
}

export function compileCosStatement(statement: CosStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$cos' || statement.length !== 2) {
    throw new Error('CosStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.cos(compileStatement<number>(statement[1], context));
}

export function compileTanStatement(statement: TanStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$tan' || statement.length !== 2) {
    throw new Error('TanStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.tan(compileStatement<number>(statement[1], context));
}

export function compileCtgStatement(statement: CtgStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$ctg' || statement.length !== 2) {
    throw new Error('CtgStatement is invalid: ' + JSON.stringify(statement));
  }

  return 1 / Math.tan(compileStatement<number>(statement[1], context));
}

export function compileLogStatement(statement: LogStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$log' || statement.length !== 2) {
    throw new Error('LogStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.log(compileStatement<number>(statement[1], context));
}

export function compileLog2Statement(statement: Log2Statement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$log2' || statement.length !== 2) {
    throw new Error('Log2Statement is invalid: ' + JSON.stringify(statement));
  }

  return Math.log2(compileStatement<number>(statement[1], context));
}

export function compileLog10Statement(statement: Log10Statement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$log10' || statement.length !== 2) {
    throw new Error('Log10Statement is invalid: ' + JSON.stringify(statement));
  }

  return Math.log10(compileStatement<number>(statement[1], context));
}

export function compileRandomStatement(statement: RandomStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$random' || statement.length > 3 || statement.length === 2) {
    throw new Error('RandomStatement is invalid: ' + JSON.stringify(statement));
  }

  if (statement.length === 1) {
    return Math.random();
  }

  const min = compileStatement<number>(statement[1], context);
  const max = compileStatement<number>(statement[2], context);

  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function compileMinStatement(statement: MinStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$min' || statement.length !== 3) {
    throw new Error('MinStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.min(compileStatement<number>(statement[1], context), compileStatement<number>(statement[2], context));
}

export function compileMaxStatement(statement: MaxStatement, context: ContextLike): number {
  if (!Array.isArray(statement) || statement[0] !== '$max' || statement.length !== 3) {
    throw new Error('MaxStatement is invalid: ' + JSON.stringify(statement));
  }

  return Math.max(compileStatement<number>(statement[1], context), compileStatement<number>(statement[2], context));
}

export function isColorStatement(statement: unknown): boolean {
  if (!Array.isArray(statement) || typeof statement[0] !== 'string') {
    return false;
  }

  return ['$rgb', '$rgba'].includes(statement[0]);
}

export function compileColorStatement(statement: ColorValue): [number, number, number, number] {
  if (statement[0] === '$rgb') {
    return compileRgbColorStatement(statement);
  }

  if (statement[0] === '$rgba') {
    return compileRgbaColorStatement(statement);
  }

  throw new Error('Unknown color statement: ' + JSON.stringify(statement));
}

export function compileRgbColorStatement(statement: RGBColorValue): [number, number, number, number] {
  return [statement[1] / 255, statement[2] / 255, statement[3] / 255, 1];
}

export function compileRgbaColorStatement(statement: RGBAColorValue): [number, number, number, number] {
  return [statement[1] / 255, statement[2] / 255, statement[3] / 255, statement[4]];
}
