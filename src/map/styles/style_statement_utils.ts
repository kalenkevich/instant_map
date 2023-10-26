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
} from './style_statement';

export function compileStatement<V>(statement: Statement<V>, context: ContextLike): V {
  if (isConstantValue(statement)) {
    return compileConstantValueStatement(statement) as V;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement, context);
  }

  if (statement[0] === '$if') {
    return compileIfStatement<V>(statement, context);
  }

  if (statement[0] === '$switch') {
    return compileSwitchCaseStatement<V>(statement, context);
  }

  if (statement[0] === '$!') {
    return !!compileNegativeStatement<V>(statement, context) as V;
  }

  if (statement[0] === '$==' || statement[0] === '$eq') {
    return compileEqualCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$!=' || statement[0] === '$neq') {
    return compileNotEqualCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$<' || statement[0] === '$lt') {
    return compileLessCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$<=' || statement[0] === '$lte') {
    return compileLessOrEqualCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$>' || statement[0] === '$gt') {
    return compileGreaterCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$>=' || statement[0] === '$gte') {
    return compileGreaterOrEqualCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$||' || statement[0] === '$or') {
    return compileOrCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$&&' || statement[0] === '$and') {
    return compileAndCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$oneOf') {
    return compileOneOfCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$has') {
    return compileHasCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$empty') {
    return compileIsEmptyCondition<V>(statement, context) as V;
  }

  if (statement[0] === '$notEmpty') {
    return compileIsNotEmptyCondition<V>(statement, context) as V;
  }

  throw new Error('Statement is invalid: ' + JSON.stringify(statement));
}

export function isStatement(statement: unknown): boolean {
  if (!Array.isArray(statement) || typeof statement[0] !== 'string') {
    return false;
  }

  return [
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
  ].includes(statement[0]);
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

export function compileConditionStatementOrValue<V>(statement: ConditionStatement<V>, context: ContextLike): V {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return statement as V;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Condition statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement, context);
  }

  return compileConditionStatement<V>(statement, context) as V;
}

export function compileConditionStatement<V>(statement: ConditionStatement<V>, context: ContextLike): boolean {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return !!statement;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Condition statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return !!compileFeatureValueStatement<boolean>(statement, context);
  }

  if (statement[0] === '$!') {
    return !!compileNegativeStatement(statement, context);
  }

  if (statement[0] === '$==' || statement[0] === '$eq') {
    return compileEqualCondition(statement, context);
  }

  if (statement[0] === '$!=' || statement[0] === '$neq') {
    return compileNotEqualCondition(statement, context);
  }

  if (statement[0] === '$<' || statement[0] === '$lt') {
    return compileLessCondition(statement, context);
  }

  if (statement[0] === '$<=' || statement[0] === '$lte') {
    return compileLessOrEqualCondition(statement, context);
  }

  if (statement[0] === '$>' || statement[0] === '$gt') {
    return compileGreaterCondition(statement, context);
  }

  if (statement[0] === '$>=' || statement[0] === '$gte') {
    return compileGreaterOrEqualCondition(statement, context);
  }

  if (statement[0] === '$||' || statement[0] === '$or') {
    return compileOrCondition(statement, context);
  }

  if (statement[0] === '$&&' || statement[0] === '$and') {
    return compileAndCondition(statement, context);
  }

  if (statement[0] === '$oneOf') {
    return compileOneOfCondition(statement, context);
  }

  if (statement[0] === '$has') {
    return compileHasCondition(statement, context);
  }

  if (statement[0] === '$empty') {
    return compileIsEmptyCondition<V>(statement, context);
  }

  if (statement[0] === '$notEmpty') {
    return compileIsNotEmptyCondition<V>(statement, context);
  }

  throw new Error('Unrecognised condition statement: ' + JSON.stringify(statement));
}

export function compileNegativeStatement<V>(statement: NegativeStatement<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$!' || statement.length < 2) {
    throw new Error('NegativeStatement is invalid: ' + JSON.stringify(statement));
  }

  return !compileConditionStatement(statement[1], context);
}

export function compileEqualCondition<V>(statement: EqualCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$==', '$eq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('EqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement === rightHandStatement;
}

export function compileNotEqualCondition<V>(statement: NotEqualCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$!=', '$neq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('NotEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement !== rightHandStatement;
}

export function compileLessCondition<V>(statement: LessCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$<', '$lt'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement < rightHandStatement;
}

export function compileLessOrEqualCondition<V>(statement: LessOrEqualCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$<=', '$lte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement <= rightHandStatement;
}

export function compileGreaterCondition<V>(statement: GreaterCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$>', '$gt'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement > rightHandStatement;
}

export function compileGreaterOrEqualCondition<V>(
  statement: GreaterOrEqualCondition<V>,
  context: ContextLike
): boolean {
  if (!Array.isArray(statement) || !['$>=', '$gte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatementOrValue(statement[1], context);
  const rightHandStatement = compileConditionStatementOrValue(statement[2], context);

  return leftHandStatement >= rightHandStatement;
}

export function compileOrCondition<V>(statement: OrCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || !['$||', '$or'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('OrCondition statement is invalid: ' + JSON.stringify(statement));
  }

  if (compileConditionStatementOrValue(statement[1], context)) {
    return true;
  }

  return !!compileConditionStatementOrValue(statement[2], context);
}

export function compileAndCondition<V>(statement: AndCondition<V>, context: ContextLike): boolean {
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

export function compileOneOfCondition<V>(statement: OneOfCondition<V>, context: ContextLike): boolean {
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

export function compileHasCondition<V>(statement: HasCondition<V>, context: ContextLike): boolean {
  if (!Array.isArray(statement) || statement[0] !== '$has' || statement.length !== 2) {
    throw new Error('HasCondition is invalid: ' + JSON.stringify(statement));
  }

  return hasPropertyValue(context, statement[1]);
}

export function compileIsEmptyCondition<V>(statement: IsEmptyCondition<V>, context: ContextLike): boolean {
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

export function compileIsNotEmptyCondition<V>(statement: IsNotEmptyCondition<V>, context: ContextLike): boolean {
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
