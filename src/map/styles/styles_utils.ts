import { Feature } from 'geojson';
import {
  PaintStatement,
  IfPaintStatement,
  IfStatementFork,
  SwitchCasePaintStatement,
  ValueStatement,
  ConditionPaintStatement,
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
} from './styles';

export function compilePaintStatement<V>(statement: PaintStatement<V>, feature: Feature): V {
  if (Array.isArray(statement)) {
    if (statement[0] === '$if') {
      return compilePaintIfStatement<V>(statement, feature);
    }

    if (statement[0] === '$switch') {
      return compilePaintSwitchStatement<V>(statement, feature);
    }

    if (statement[0] === '$get') {
      return compileFeatureValueStatement<V>(statement, feature);
    }

    throw new Error('Paint statement is invalid: ' + JSON.stringify(statement));
  }

  return statement as V;
}

export function compilePaintIfStatement<V>(statement: IfPaintStatement<V>, feature: Feature): V {
  if (!Array.isArray(statement) || statement[0] === '$if' || !(statement.length === 3 || statement.length === 4)) {
    throw new Error('If statement is invalid: ' + JSON.stringify(statement));
  }

  const conditionResult: boolean = compileConditionStatement(statement[1], feature);
  const thenStatement = statement[2];
  const elseStatement = statement[3];

  if (conditionResult) {
    return compileIfStatementFork<V>(thenStatement, feature);
  } else if (elseStatement !== undefined) {
    return compileIfStatementFork<V>(elseStatement, feature);
  }

  throw new Error('If statement is invalid: ' + JSON.stringify(thenStatement));
}

export function compileIfStatementFork<V>(statement: IfStatementFork<V>, feature: Feature): V {
  if (['number', 'string', 'boolean'].includes(typeof statement)) {
    return statement as V;
  }

  if (!Array.isArray(statement)) {
    throw new Error('IfStatementFork is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$if') {
    return compilePaintIfStatement<V>(statement, feature);
  }

  if (statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement, feature);
  }

  throw new Error('IfStatementFork is invalid: ' + JSON.stringify(statement));
}

export function compilePaintSwitchStatement<V>(statement: SwitchCasePaintStatement<V>, feature: Feature): V {
  if (!Array.isArray(statement) || statement[0] === '$switch' || statement.length < 2) {
    throw new Error('Switch statement is invalid: ' + JSON.stringify(statement));
  }

  const [, switchValueStatement, ...caseStatements] = statement;
  const defaultStatementIndex = caseStatements.findIndex(s => s[0] === '$default');

  if (defaultStatementIndex !== -1 && defaultStatementIndex !== caseStatements.length - 1) {
    throw new Error('Switch statement is invalid, $default should be last: ' + JSON.stringify(statement));
  }

  const switchValue = compileValueStatement(switchValueStatement, feature);

  for (const caseStatement of caseStatements) {
    if (caseStatement[0] === '$default') {
      continue;
    }

    const caseValue = compileValueStatement(caseStatement[0], feature);

    if (switchValue === caseValue) {
      return compileValueStatement(caseStatement[1], feature);
    }
  }

  if (defaultStatementIndex !== -1) {
    const defaultStatement = caseStatements[defaultStatementIndex];

    return compileValueStatement(defaultStatement[1], feature);
  }

  return undefined;
}

export function compileConditionStatement(statement: ConditionPaintStatement, feature: Feature): boolean {
  if (['boolean', 'string', 'number'].includes(typeof statement)) {
    return !!statement;
  }

  if (!Array.isArray(statement)) {
    throw new Error('Condition statement is invalid: ' + JSON.stringify(statement));
  }

  if (statement[0] === '$get') {
    return !!compileFeatureValueStatement<boolean>(statement, feature);
  }

  if (statement[0] === '$==' || statement[0] === '$eq') {
    return compileEqualCondition(statement, feature);
  }

  if (statement[0] === '$!=' || statement[0] === '$neq') {
    return compileNotEqualCondition(statement, feature);
  }

  if (statement[0] === '$<' || statement[0] === '$lt') {
    return compileLessCondition(statement, feature);
  }

  if (statement[0] === '$<=' || statement[0] === '$lte') {
    return compileLessOrEqualCondition(statement, feature);
  }

  if (statement[0] === '$>' || statement[0] === '$gt') {
    return compileGreaterCondition(statement, feature);
  }

  if (statement[0] === '$>=' || statement[0] === '$gte') {
    return compileGreaterOrEqualCondition(statement, feature);
  }

  if (statement[0] === '$||' || statement[0] === '&or') {
    return compileOrCondition(statement, feature);
  }

  if (statement[0] === '$&&' || statement[0] === '&and') {
    return compileAndCondition(statement, feature);
  }

  throw new Error('Unrecognised condition statement: ' + JSON.stringify(statement));
}

export function compileValueStatement<V>(statement: ValueStatement<V>, feature: Feature): V {
  if (Array.isArray(statement) && statement[0] === '$get') {
    return compileFeatureValueStatement<V>(statement, feature);
  }

  if (isConstantValue(statement)) {
    return statement as V;
  }

  throw new Error('ValueStatement statement in invalid: ' + JSON.stringify(statement));
}

export function compileEqualCondition(statement: EqualCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$==', '$eq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('EqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement === rightHandStatement;
}

export function compileNotEqualCondition(statement: NotEqualCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$!=', '$neq'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('EqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement !== rightHandStatement;
}

export function compileLessCondition(statement: LessCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$<', '$lt'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement < rightHandStatement;
}

export function compileLessOrEqualCondition(statement: LessOrEqualCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$<=', '$lte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('LessOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement <= rightHandStatement;
}

export function compileGreaterCondition(statement: GreaterCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$>', '$ge'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement > rightHandStatement;
}

export function compileGreaterOrEqualCondition(statement: GreaterOrEqualCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$>=', '$gte'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('GreaterOrEqualCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement >= rightHandStatement;
}

export function compileOrCondition(statement: OrCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$||', '$or'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('OrCondition statement is invalid: ' + JSON.stringify(statement));
  }

  if (compileConditionStatement(statement[1], feature)) {
    return true;
  }

  return compileConditionStatement(statement[2], feature);
}

export function compileAndCondition(statement: AndCondition, feature: Feature): boolean {
  if (!Array.isArray(statement) || !['$&&', '$and'].includes(statement[0]) || statement.length !== 3) {
    throw new Error('AndCondition statement is invalid: ' + JSON.stringify(statement));
  }

  const leftHandStatement = compileConditionStatement(statement[1], feature);
  const rightHandStatement = compileConditionStatement(statement[2], feature);

  return leftHandStatement && rightHandStatement;
}

export function compileFeatureValueStatement<V>(statement: FeatureValue, feature: Feature): V {
  if (!Array.isArray(statement) || statement[0] !== '$get') {
    throw new Error('FeatureValue statement is invalid: ' + JSON.stringify(statement));
  }

  return getPropertyValue<V>(feature, statement[1]);
}

export function compileConstantValueStatement<V>(statement: ConstantValue<V>): V {
  if (!isConstantValue(statement)) {
    throw new Error('Constant statement in invalid: ' + JSON.stringify(statement));
  }

  return statement as V;
}

export function isConstantValue<V>(statement: PaintStatement<V>): boolean {
  return ['boolean', 'string', 'number'].includes(typeof statement);
}

export function getPropertyValue<V>(source: any, property: string): ConstantValue<V> {
  let currentSource = source;
  const propertyPath = property.split('.');

  for (const pathItem of propertyPath) {
    if (currentSource === null || currentSource == undefined) {
      return currentSource;
    }

    if (pathItem in currentSource) {
      currentSource = currentSource[pathItem];
    } else {
      return undefined;
    }
  }

  return currentSource;
}
