/* eslint-disable @typescript-eslint/no-explicit-any */
import { Feature } from 'geojson';
import { describe, expect, it } from '@jest/globals';
import {
  Statement,
  IfStatement,
  SwitchCaseStatement,
  EqualCondition,
  NotEqualCondition,
  LessCondition,
  LessOrEqualCondition,
  GreaterCondition,
  GreaterOrEqualCondition,
  OrCondition,
  OneOfCondition,
  AndCondition,
  ValueStatement,
  FeatureValue,
  HasCondition,
  ConditionStatement,
  IsEmptyCondition,
  IsNotEmptyCondition,
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
} from '../../../../src/map/styles/style_statement';
import {
  compileStatement,
  compileIfStatement,
  compileSwitchCaseStatement,
  compileConditionStatement,
  compileConditionStatementOrValue,
  compileEqualCondition,
  compileNotEqualCondition,
  compileLessCondition,
  compileLessOrEqualCondition,
  compileGreaterCondition,
  compileGreaterOrEqualCondition,
  compileOrCondition,
  compileAndCondition,
  compileOneOfCondition,
  compileHasCondition,
  compileValueStatement,
  compileFeatureValueStatement,
  compileConstantValueStatement,
  isConstantValue,
  getPropertyValue,
  compileIsEmptyCondition,
  compileIsNotEmptyCondition,
  compileMathStatement,
  compilePlusStatement,
  compileMinusStatement,
  compileMultiplyStatement,
  compileDivisionStatement,
  compilePowerStatement,
  compileSqrtStatement,
  compileAbsStatement,
  compileFloorStatement,
  compileCeilStatement,
  compileRoundStatement,
  compileExpStatement,
  compileSinStatement,
  compileCosStatement,
  compileTanStatement,
  compileCtgStatement,
  compileLogStatement,
  compileLog2Statement,
  compileLog10Statement,
  compileRandomStatement,
  compileMinStatement,
  compileMaxStatement,
} from '../../../../src/map/styles/style_statement_utils';

const SampleWaterFeature: Feature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [],
  },
  properties: {
    class: 'water',
    subClass: 'ocean',
    level: 2,
    minzoom: 0,
    maxzoom: 5,
  },
};

describe('compileStatement', () => {
  it('should compile a contant value', () => {
    expect(
      compileStatement('value', {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      }),
    ).toBe('value');

    expect(
      compileStatement(123, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      }),
    ).toBe(123);

    expect(
      compileStatement(true, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      }),
    ).toBe(true);

    expect(
      compileStatement(false, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      }),
    ).toBe(false);

    expect(
      compileStatement(
        {},
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [],
          },
          properties: {},
        },
      ),
    ).toEqual({});

    expect(
      compileStatement([], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      }),
    ).toEqual([]);
  });

  it('should compile a feature value', () => {
    expect(
      compileStatement(['$get', 'properties.class'], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('water');
  });

  it('should compile $if statement', () => {
    expect(
      compileStatement(['$if', ['$eq', ['$get', 'properties.class'], 'water'], 'then result'], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('then result');

    expect(
      compileStatement(['$if', ['$eq', ['$get', 'properties.class'], 'notwater'], 'then result', 'else result'], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('else result');
  });

  it('should compile $switch statement', () => {
    const switchCaseStatement: SwitchCaseStatement<string> = [
      '$switch',
      ['$get', 'properties.class'],
      ['water', 'water case'],
      ['land', 'land case'],
      ['$default', 'default case'],
    ];

    expect(compileStatement(switchCaseStatement, SampleWaterFeature)).toBe('water case');
  });

  it('should compile $eq condition statement', () => {
    const conditionStatement: ConditionStatement = ['$eq', ['$get', 'properties.class'], 'water'];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $neq condition statement', () => {
    const conditionStatement: ConditionStatement = ['$neq', ['$get', 'properties.class'], 'grass'];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $lt condition statement', () => {
    const conditionStatement: ConditionStatement = ['$lt', ['$get', 'properties.minzoom'], 0];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(false);
  });

  it('should compile $lte condition statement', () => {
    const conditionStatement: ConditionStatement = ['$lte', ['$get', 'properties.minzoom'], 0];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $gt condition statement', () => {
    const conditionStatement: ConditionStatement = ['$gt', ['$get', 'properties.maxzoom'], 1];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $gte condition statement', () => {
    const conditionStatement: ConditionStatement = ['$gte', ['$get', 'properties.maxzoom'], 5];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $and condition statement', () => {
    const conditionStatement: ConditionStatement = [
      '$and',
      ['$eq', ['$get', 'properties.maxzoom'], 5],
      ['$eq', ['$get', 'properties.minzoom'], 0],
    ];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $or condition statement', () => {
    const conditionStatement: ConditionStatement = [
      '$or',
      ['$eq', ['$get', 'properties.maxzoom'], 6],
      ['$eq', ['$get', 'properties.minzoom'], 0],
    ];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $oneOf condition statement', () => {
    const conditionStatement: ConditionStatement = [
      '$oneOf',
      ['$get', 'properties.class'],
      'water',
      'land',
      'transportation',
    ];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $has condition statement', () => {
    const conditionStatement: ConditionStatement = ['$has', 'properties.class'];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });

  it('should compile $! condition statement', () => {
    const conditionStatement: ConditionStatement = ['$!', ['$eq', ['$get', 'properties.class'], 'land']];

    expect(compileStatement(conditionStatement, SampleWaterFeature)).toBe(true);
  });
});

describe('compileIfStatement', () => {
  it('should compile condition and return then fork', () => {
    expect(
      compileIfStatement(['$if', ['$eq', ['$get', 'properties.class'], 'water'], 'then result', 'else result'], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('then result');
  });

  it('should compile condition and return else fork', () => {
    expect(
      compileIfStatement(['$if', ['$eq', ['$get', 'properties.class'], 'land'], 'then result', 'else result'], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('else result');
  });

  it('should compile complex statement', () => {
    const thenStatement: Statement<string> = ['$get', 'properties.thenValue'];
    const elseStatement: Statement<string> = ['$get', 'properties.elseValue'];

    const orCondition1: OrCondition = [
      '$or',
      ['$eq', ['$get', 'properties.class'], 'water'],
      ['$eq', ['$get', 'properties.class'], 'land'],
    ];
    const ifStatement1: IfStatement<string> = ['$if', orCondition1, thenStatement, elseStatement];
    expect(
      compileIfStatement(ifStatement1, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
          thenValue: 'then result',
          elseValue: 'else result',
        },
      }),
    ).toBe('then result');

    const andCondition1: AndCondition = [
      '$and',
      ['$eq', ['$get', 'properties.class'], 'water'],
      ['$eq', ['$get', 'properties.class'], 'land'],
    ];
    const ifStatement2: IfStatement<string> = ['$if', andCondition1, thenStatement, elseStatement];
    expect(
      compileIfStatement(ifStatement2, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
          thenValue: 'then result',
          elseValue: 'else result',
        },
      }),
    ).toBe('else result');
  });

  it('should cast condition value', () => {
    expect(
      compileIfStatement(['$if', 1, 2, 3] as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe(2);

    expect(
      compileIfStatement(['$if', 0, 2, 3] as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe(3);
  });

  it('should throw an error if statement is invalid', () => {
    expect(() => {
      compileIfStatement('hello' as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      });
    }).toThrowError('If statement is invalid: "hello"');

    expect(() => {
      compileIfStatement([] as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      });
    }).toThrowError('If statement is invalid: []');

    expect(() => {
      compileIfStatement({} as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      });
    }).toThrowError('If statement is invalid: {}');

    expect(() => {
      compileIfStatement(['$if', 1, 2, 3, 4] as unknown as IfStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      });
    }).toThrowError('If statement is invalid: ["$if",1,2,3,4]');
  });
});

describe('compileSwitchCaseStatement', () => {
  const SampleSwitchCaseStatement: SwitchCaseStatement<string> = [
    '$switch',
    ['$get', 'properties.class'],
    ['water', 'water case'],
    ['land', 'land case'],
    ['$default', 'default case'],
  ];

  it('should return value based on switch/case rules', () => {
    expect(
      compileSwitchCaseStatement(SampleSwitchCaseStatement, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      }),
    ).toBe('water case');

    expect(
      compileSwitchCaseStatement(SampleSwitchCaseStatement, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'land',
        },
      }),
    ).toBe('land case');
  });

  it('should return default value based on switch/case rules', () => {
    expect(
      compileSwitchCaseStatement(SampleSwitchCaseStatement, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      }),
    ).toBe('default case');

    expect(
      compileSwitchCaseStatement(['$switch', ['$get', 'properties.class'], ['$default', 'default case']], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      }),
    ).toBe('default case');
  });

  it('should validate switch case statement', () => {
    expect(() => {
      compileSwitchCaseStatement([] as unknown as SwitchCaseStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      });
    }).toThrowError('Switch statement is invalid: []');

    expect(() => {
      compileSwitchCaseStatement(['$switch'] as unknown as SwitchCaseStatement<string>, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      });
    }).toThrowError('Switch statement is invalid: ["$switch"]');

    expect(() => {
      compileSwitchCaseStatement(['$switch', ['$get', 'properties.class']], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      });
    }).toThrowError('Switch statement is invalid: ["$switch",["$get","properties.class"]]');

    expect(() => {
      compileSwitchCaseStatement(['$switch', ['$get', 'properties.class'], ['$default', 'blue'], ['ocean', 'blue']], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'default',
        },
      });
    }).toThrowError(
      'Switch statement is invalid, $default should be last case: ["$switch",["$get","properties.class"],["$default","blue"],["ocean","blue"]]',
    );
  });
});

describe('compileConditionStatement', () => {
  it('should treat statement as a feature value and cast it to boolean', () => {
    const featureValue: FeatureValue = ['$get', 'properties.class'];

    expect(compileConditionStatement(featureValue, SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a constant value and cast it to boolean', () => {
    expect(compileConditionStatement('water', SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$eq" condition statement', () => {
    expect(compileConditionStatement(['$eq', ['$get', 'properties.class'], 'water'], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as an "$neq" condition statement', () => {
    expect(compileConditionStatement(['$neq', ['$get', 'properties.class'], 'grass'], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$lt" condition statement', () => {
    expect(compileConditionStatement(['$lt', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(false);
  });

  it('should treat statement as a "$lte" condition statement', () => {
    expect(compileConditionStatement(['$lte', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$gt" condition statement', () => {
    expect(compileConditionStatement(['$gt', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$gte" condition statement', () => {
    expect(compileConditionStatement(['$gte', ['$get', 'properties.maxzoom'], 5], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as an "$and" condition statement', () => {
    expect(
      compileConditionStatement(
        ['$and', ['$eq', ['$get', 'properties.maxzoom'], 5], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should treat statement as an "$or" condition statement', () => {
    expect(
      compileConditionStatement(
        ['$or', ['$eq', ['$get', 'properties.maxzoom'], 6], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should treat statement as an "$oneOf" condition statement', () => {
    expect(
      compileConditionStatement(
        ['$oneOf', ['$get', 'properties.class'], 'water', 'land', 'transportation'],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should treat statement as an "$has" condition statement', () => {
    expect(compileConditionStatement(['$has', 'properties.class'], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as an "$!" condition statement', () => {
    expect(compileConditionStatement(['$!', ['$eq', ['$get', 'properties.class'], 'land']], SampleWaterFeature)).toBe(
      true,
    );
  });
});

describe('compileConditionStatementOrValue', () => {
  it('should treat statement as a feature value', () => {
    const featureValue: FeatureValue = ['$get', 'properties.class'];

    expect(compileConditionStatementOrValue(featureValue, SampleWaterFeature)).toBe('water');
  });

  it('should treat statement as a constant value', () => {
    expect(compileConditionStatementOrValue('water', SampleWaterFeature)).toBe('water');
  });

  it('should treat statement as a "$eq" condition statement', () => {
    expect(compileConditionStatementOrValue(['$eq', ['$get', 'properties.class'], 'water'], SampleWaterFeature)).toBe(
      true,
    );
  });

  it('should treat statement as an "$neq" condition statement', () => {
    expect(compileConditionStatementOrValue(['$neq', ['$get', 'properties.class'], 'grass'], SampleWaterFeature)).toBe(
      true,
    );
  });

  it('should treat statement as a "$lt" condition statement', () => {
    expect(compileConditionStatementOrValue(['$lt', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(
      false,
    );
  });

  it('should treat statement as a "$lte" condition statement', () => {
    expect(compileConditionStatementOrValue(['$lte', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(
      true,
    );
  });

  it('should treat statement as a "$gt" condition statement', () => {
    expect(compileConditionStatementOrValue(['$gt', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$gte" condition statement', () => {
    expect(compileConditionStatementOrValue(['$gte', ['$get', 'properties.maxzoom'], 5], SampleWaterFeature)).toBe(
      true,
    );
  });

  it('should treat statement as an "$and" condition statement', () => {
    expect(
      compileConditionStatementOrValue(
        ['$and', ['$eq', ['$get', 'properties.maxzoom'], 5], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should treat statement as an "$or" condition statement', () => {
    expect(
      compileConditionStatementOrValue(
        ['$or', ['$eq', ['$get', 'properties.maxzoom'], 6], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });
});

describe('compileEqualCondition', () => {
  const SampleTrueEqualCondition: EqualCondition = ['$eq', ['$get', 'properties.maxzoom'], 5];
  const SampleFalseEqualCondition: EqualCondition = ['$eq', ['$get', 'properties.maxzoom'], 4];

  it('should return true for truthy "EQUAL" condition', () => {
    expect(compileEqualCondition(['$eq', 1, 1], SampleWaterFeature)).toBe(true);
    expect(compileEqualCondition(['$==', 1, 1], SampleWaterFeature)).toBe(true);
    expect(compileEqualCondition(SampleTrueEqualCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "EQUAL" condition', () => {
    expect(compileEqualCondition(['$eq', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileEqualCondition(['$eq', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileEqualCondition(['$==', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileEqualCondition(['$==', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileEqualCondition(SampleFalseEqualCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$eq" as an function name', () => {
    expect(compileEqualCondition(['$eq', ['$get', 'properties.maxzoom'], 5], SampleWaterFeature)).toBe(true);
  });

  it('should accept "==" as an function name', () => {
    expect(compileEqualCondition(['$==', ['$get', 'properties.maxzoom'], 5], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileEqualCondition(['$eq'] as unknown as EqualCondition, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$eq"]');

    expect(() => {
      compileEqualCondition(['$=='] as unknown as EqualCondition, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$=="]');

    expect(() => {
      compileEqualCondition(['$==', 1, 2, 3] as unknown as EqualCondition, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$==",1,2,3]');
  });
});

describe('compileNotEqualCondition', () => {
  const SampleTrueNotEqualCondition: NotEqualCondition = ['$neq', ['$get', 'properties.maxzoom'], 4];
  const SampleFalseNotEqualCondition: NotEqualCondition = ['$neq', ['$get', 'properties.maxzoom'], 5];

  it('should return true for truthy "NOT EQUAL" condition', () => {
    expect(compileNotEqualCondition(['$neq', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileNotEqualCondition(['$neq', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileNotEqualCondition(['$!=', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileNotEqualCondition(['$!=', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileNotEqualCondition(SampleTrueNotEqualCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "NOT EQUAL" condition', () => {
    expect(compileNotEqualCondition(['$neq', 2, 2], SampleWaterFeature)).toBe(false);
    expect(compileNotEqualCondition(['$!=', 2, 2], SampleWaterFeature)).toBe(false);
    expect(compileNotEqualCondition(SampleFalseNotEqualCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$neq" as an function name', () => {
    expect(compileNotEqualCondition(['$neq', ['$get', 'properties.maxzoom'], 4], SampleWaterFeature)).toBe(true);
  });

  it('should accept "!=" as an function name', () => {
    expect(compileNotEqualCondition(['$!=', ['$get', 'properties.maxzoom'], 4], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileNotEqualCondition(['$neq'] as unknown as NotEqualCondition, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$neq"]');

    expect(() => {
      compileNotEqualCondition(['$!='] as unknown as NotEqualCondition, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$!="]');

    expect(() => {
      compileNotEqualCondition(['$!=', 1, 2, 3] as unknown as NotEqualCondition, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$!=",1,2,3]');
  });
});

describe('compileLessCondition', () => {
  const SampleTrueLessCondition: LessCondition = ['$lt', ['$get', 'properties.maxzoom'], 6];
  const SampleFalseLessCondition: LessCondition = ['$lt', ['$get', 'properties.maxzoom'], 1];

  it('should return true for truthy "LESS THEN" condition', () => {
    expect(compileLessCondition(['$lt', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessCondition(['$<', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessCondition(SampleTrueLessCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "LESS THEN" condition', () => {
    expect(compileLessCondition(['$lt', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessCondition(['$<', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessCondition(['$lt', 1, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessCondition(['$<', 1, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessCondition(SampleFalseLessCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$lt" as an function name', () => {
    expect(compileLessCondition(['$lt', ['$get', 'properties.minzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should accept "$<" as an function name', () => {
    expect(compileLessCondition(['$<', ['$get', 'properties.minzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileLessCondition(['$<'] as unknown as LessCondition, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$<"]');

    expect(() => {
      compileLessCondition(['$lt'] as unknown as LessCondition, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$lt"]');

    expect(() => {
      compileLessCondition(['$lt', '1', '2', '3'] as unknown as LessCondition, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$lt","1","2","3"]');
  });
});

describe('compileLessOrEqualCondition', () => {
  const SampleTrueLessOrEqualCondition: LessOrEqualCondition = ['$lte', ['$get', 'properties.minzoom'], 0];

  const SampleFalseLessOrEqualCondition: LessOrEqualCondition = ['$lte', ['$get', 'properties.maxzoom'], 4];

  it('should return true for truthy "LESS THEN EQUAL" condition', () => {
    expect(compileLessOrEqualCondition(['$lte', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessOrEqualCondition(['$lte', 2, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessOrEqualCondition(['$<=', 1, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessOrEqualCondition(['$<=', 2, 2], SampleWaterFeature)).toBe(true);
    expect(compileLessOrEqualCondition(SampleTrueLessOrEqualCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "LESS THEN EQUAL" condition', () => {
    expect(compileLessOrEqualCondition(['$lte', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessOrEqualCondition(['$<=', 2, 1], SampleWaterFeature)).toBe(false);
    expect(compileLessOrEqualCondition(SampleFalseLessOrEqualCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$lte" as an function name', () => {
    expect(compileLessOrEqualCondition(['$lte', ['$get', 'properties.minzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should accept "$<=" as an function name', () => {
    expect(compileLessOrEqualCondition(['$<=', ['$get', 'properties.minzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileLessOrEqualCondition(['$<='] as unknown as LessOrEqualCondition, SampleWaterFeature);
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$<="]');

    expect(() => {
      compileLessOrEqualCondition(['$lte'] as unknown as LessOrEqualCondition, SampleWaterFeature);
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$lte"]');

    expect(() => {
      compileLessOrEqualCondition(['$lte', '1', '2', '3'] as unknown as LessOrEqualCondition, SampleWaterFeature);
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$lte","1","2","3"]');
  });
});

describe('compileGreaterCondition', () => {
  const SampleTrueGreaterCondition: GreaterCondition = ['$gt', ['$get', 'properties.maxzoom'], 1];

  const SampleFalseGreaterCondition: GreaterCondition = ['$gt', ['$get', 'properties.maxzoom'], 5];

  it('should return true for truthy "GREAT THEN" condition', () => {
    expect(compileGreaterCondition(['$gt', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileGreaterCondition(['$>', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileGreaterCondition(SampleTrueGreaterCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "GREAT THEN" condition', () => {
    expect(compileGreaterCondition(['$gt', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterCondition(['$gt', 2, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterCondition(['$>', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterCondition(['$>', 2, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterCondition(SampleFalseGreaterCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$gte" as an function name', () => {
    expect(compileGreaterCondition(['$gt', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should accept "$>=" as an function name', () => {
    expect(compileGreaterCondition(['$>', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileGreaterCondition(['$>'] as unknown as GreaterCondition, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$>"]');

    expect(() => {
      compileGreaterCondition(['$gt'] as unknown as GreaterCondition, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$gt"]');

    expect(() => {
      compileGreaterCondition(['$gt', '1', '2', '3'] as unknown as GreaterCondition, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$gt","1","2","3"]');
  });
});

describe('compileGreaterOrEqualCondition', () => {
  const SampleTrueGreaterOrEqualCondition: GreaterOrEqualCondition = ['$gte', ['$get', 'properties.maxzoom'], 1];

  const SampleFalseGreaterOrEqualCondition: GreaterOrEqualCondition = ['$gte', ['$get', 'properties.maxzoom'], 6];

  it('should return true for truthy "GREAT THEN OR EQUAL" condition', () => {
    expect(compileGreaterOrEqualCondition(['$gte', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileGreaterOrEqualCondition(['$gte', 2, 2], SampleWaterFeature)).toBe(true);
    expect(compileGreaterOrEqualCondition(['$>=', 2, 1], SampleWaterFeature)).toBe(true);
    expect(compileGreaterOrEqualCondition(['$>=', 2, 2], SampleWaterFeature)).toBe(true);
    expect(compileGreaterOrEqualCondition(SampleTrueGreaterOrEqualCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "GREAT THEN OR EQUAL" condition', () => {
    expect(compileGreaterOrEqualCondition(['$gte', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterOrEqualCondition(['$>=', 1, 2], SampleWaterFeature)).toBe(false);
    expect(compileGreaterOrEqualCondition(SampleFalseGreaterOrEqualCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$gte" as an function name', () => {
    expect(compileGreaterOrEqualCondition(['$gte', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should accept "$>=" as an function name', () => {
    expect(compileGreaterOrEqualCondition(['$>=', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileGreaterOrEqualCondition(['$>='] as unknown as GreaterOrEqualCondition, SampleWaterFeature);
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$>="]');

    expect(() => {
      compileGreaterOrEqualCondition(['$gte'] as unknown as GreaterOrEqualCondition, SampleWaterFeature);
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$gte"]');

    expect(() => {
      compileGreaterOrEqualCondition(['$gte', '1', '2', '3'] as unknown as GreaterOrEqualCondition, SampleWaterFeature);
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$gte","1","2","3"]');
  });
});

describe('compileOrCondition', () => {
  const SampleTrueOrCondition: OrCondition = [
    '$or',
    ['$eq', ['$get', 'properties.class'], 'water'],
    ['$eq', ['$get', 'properties.subClass'], 'sea'],
  ];

  const SampleFalseOrCondition: OrCondition = [
    '$or',
    ['$eq', ['$get', 'properties.class'], 'land'],
    ['$eq', ['$get', 'properties.subClass'], 'sea'],
  ];

  it('should return true for truthy "OR" condition', () => {
    expect(compileOrCondition(['$or', true, true], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(['$or', false, true], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(['$or', true, false], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(['$||', true, true], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(['$||', false, true], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(['$||', true, false], SampleWaterFeature)).toBe(true);
    expect(compileOrCondition(SampleTrueOrCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "OR" condition', () => {
    expect(compileOrCondition(['$or', false, false], SampleWaterFeature)).toBe(false);
    expect(compileOrCondition(['$||', false, false], SampleWaterFeature)).toBe(false);
    expect(compileOrCondition(SampleFalseOrCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$or" as an function name', () => {
    expect(
      compileOrCondition(
        ['$or', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should accept "$||" as an function name', () => {
    expect(
      compileOrCondition(
        ['$||', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileOrCondition(['$or'] as unknown as OrCondition, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$or"]');

    expect(() => {
      compileOrCondition(['$||'] as unknown as OrCondition, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$||"]');

    expect(() => {
      compileOrCondition(['$or', '1', '2', '3'] as unknown as OrCondition, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$or","1","2","3"]');
  });
});

describe('compileAndCondition', () => {
  const SampleTrueAndCondition: AndCondition = [
    '$and',
    ['$eq', ['$get', 'properties.class'], 'water'],
    ['$eq', ['$get', 'properties.subClass'], 'ocean'],
  ];

  const SampleFalseAndCondition: AndCondition = [
    '$and',
    ['$eq', ['$get', 'properties.class'], 'water'],
    ['$neq', ['$get', 'properties.subClass'], 'ocean'],
  ];

  it('should return true for truthy "AND" condition', () => {
    expect(compileAndCondition(['$and', true, true], SampleWaterFeature)).toBe(true);
    expect(compileAndCondition(['$&&', true, true], SampleWaterFeature)).toBe(true);
    expect(compileAndCondition(SampleTrueAndCondition, SampleWaterFeature)).toBe(true);
  });

  it('should return false for falsy "AND" condition', () => {
    expect(compileAndCondition(['$and', true, false], SampleWaterFeature)).toBe(false);
    expect(compileAndCondition(['$and', false, true], SampleWaterFeature)).toBe(false);
    expect(compileAndCondition(['$&&', true, false], SampleWaterFeature)).toBe(false);
    expect(compileAndCondition(['$&&', false, true], SampleWaterFeature)).toBe(false);
    expect(compileAndCondition(SampleFalseAndCondition, SampleWaterFeature)).toBe(false);
  });

  it('should accept "$and" as an function name', () => {
    expect(
      compileAndCondition(
        ['$and', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should accept "$&&" as an function name', () => {
    expect(
      compileAndCondition(
        ['$&&', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature,
      ),
    ).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileAndCondition(['$and'] as unknown as AndCondition, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$and"]');

    expect(() => {
      compileAndCondition(['$&&'] as unknown as AndCondition, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$&&"]');

    expect(() => {
      compileAndCondition(['$&&', '1', '2', '3'] as unknown as AndCondition, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$&&","1","2","3"]');
  });
});

describe('compileOneOfCondition', () => {
  it('should return true for truthy "ONE OF" condition', () => {
    expect(
      compileOneOfCondition(['$oneOf', ['$get', 'properties.class'], 'water', 'land', 'buildings'], SampleWaterFeature),
    ).toBe(true);
  });

  it('should return false for falthy "ONE OF" condition', () => {
    expect(
      compileOneOfCondition(['$oneOf', ['$get', 'properties.class'], 'test', 'land', 'buildings'], SampleWaterFeature),
    ).toBe(false);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileOneOfCondition([] as unknown as OneOfCondition, SampleWaterFeature);
    }).toThrowError('OneOfCondition is invalid: []');

    expect(() => {
      compileOneOfCondition(['$oneOf'] as unknown as OneOfCondition, SampleWaterFeature);
    }).toThrowError('OneOfCondition is invalid: ["$oneOf"]');

    expect(() => {
      compileOneOfCondition(['$oneOf', 1] as unknown as OneOfCondition, SampleWaterFeature);
    }).toThrowError('OneOfCondition is invalid: ["$oneOf",1]');
  });
});

describe('compileHasCondition', () => {
  it('should return true for truthy "HAS" condition', () => {
    expect(compileHasCondition(['$has', 'properties.class'], SampleWaterFeature)).toBe(true);
  });

  it('should return false for falthy "HAS" condition', () => {
    expect(compileHasCondition(['$has', 'properties.undefinedProp'], SampleWaterFeature)).toBe(false);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileHasCondition([] as unknown as HasCondition, SampleWaterFeature);
    }).toThrowError('HasCondition is invalid: []');

    expect(() => {
      compileHasCondition(['$has'] as unknown as HasCondition, SampleWaterFeature);
    }).toThrowError('HasCondition is invalid: ["$has"]');
  });
});

describe('compileIsEmptyCondition', () => {
  it('should return true for truthy "empty" condition', () => {
    expect(compileIsEmptyCondition(['$empty', ['$get', 'properties.undefinedProp']], SampleWaterFeature)).toBe(true);
  });

  it('should return false for falthy "empty" condition', () => {
    expect(compileIsEmptyCondition(['$empty', ['$get', 'properties.class']], SampleWaterFeature)).toBe(false);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileIsEmptyCondition([] as unknown as IsEmptyCondition, SampleWaterFeature);
    }).toThrowError('IsEmptyCondition statement is invalid: []');

    expect(() => {
      compileIsEmptyCondition(['$empty'] as unknown as IsEmptyCondition, SampleWaterFeature);
    }).toThrowError('IsEmptyCondition statement is invalid: ["$empty"]');
  });
});

describe('compileIsNotEmptyCondition', () => {
  it('should return true for truthy "not empty" condition', () => {
    expect(compileIsNotEmptyCondition(['$notEmpty', ['$get', 'properties.class']], SampleWaterFeature)).toBe(true);
  });

  it('should return false for falthy "not empty" condition', () => {
    expect(compileIsNotEmptyCondition(['$notEmpty', ['$get', 'properties.undefinedProp']], SampleWaterFeature)).toBe(
      false,
    );
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileIsNotEmptyCondition([] as unknown as IsNotEmptyCondition, SampleWaterFeature);
    }).toThrowError('IsNotEmptyCondition statement is invalid: []');

    expect(() => {
      compileIsNotEmptyCondition(['$notEmpty'] as unknown as IsNotEmptyCondition, SampleWaterFeature);
    }).toThrowError('IsNotEmptyCondition statement is invalid: ["$notEmpty"]');
  });
});

describe('compileValueStatement', () => {
  const valueStatement: ValueStatement<string> = ['$get', 'properties.class'];

  it('should return feature value', () => {
    expect(compileValueStatement(valueStatement, SampleWaterFeature)).toBe('water');
  });

  it('should return constant value', () => {
    expect(compileValueStatement('water', SampleWaterFeature)).toBe('water');
  });

  it('should throw an error when statement is invalid', () => {
    expect(() => {
      compileValueStatement(['$if', ['$eq', 1, 1]], SampleWaterFeature);
    }).toThrowError('Value statement in invalid: ["$if",["$eq",1,1]]');
  });
});

describe('compileFeatureValueStatement', () => {
  const featureValue: FeatureValue = ['$get', 'properties.class'];

  it('should return feature value', () => {
    expect(compileFeatureValueStatement(featureValue, SampleWaterFeature)).toBe('water');
  });

  it('should throw an error when eature statement is invalid', () => {
    expect(() => {
      compileFeatureValueStatement([] as unknown as FeatureValue, SampleWaterFeature);
    }).toThrowError('FeatureValue statement is invalid: []');

    expect(() => {
      compileFeatureValueStatement(['$get'] as unknown as FeatureValue, SampleWaterFeature);
    }).toThrowError('FeatureValue statement is invalid: ["$get"]');

    expect(() => {
      compileFeatureValueStatement(
        ['$get', 'test.property', 'unknown param'] as unknown as FeatureValue,
        SampleWaterFeature,
      );
    }).toThrowError('FeatureValue statement is invalid: ["$get","test.property","unknown param"]');

    expect(() => {
      compileFeatureValueStatement(
        ['$undefinedFunction', 'test.property', 'unknown param'] as unknown as FeatureValue,
        SampleWaterFeature,
      );
    }).toThrowError('FeatureValue statement is invalid: ["$undefinedFunction","test.property","unknown param"]');
  });
});

describe('compileConstantValueStatement', () => {
  const SampleIfStatement: IfStatement<string> = [
    '$if',
    ['$eq', ['$get', 'properties.class'], 'water'],
    'blue',
    'green',
  ];

  it('should return statement as a value if it is a constant', () => {
    expect(compileConstantValueStatement(true)).toBe(true);
    expect(compileConstantValueStatement(false)).toBe(false);
    expect(compileConstantValueStatement(123)).toBe(123);
    expect(compileConstantValueStatement('color')).toBe('color');
  });

  it('should throw an error when statement is not a constant', () => {
    expect(() => {
      compileConstantValueStatement(SampleIfStatement);
    }).toThrowError('Constant statement in invalid: ' + JSON.stringify(SampleIfStatement));
  });
});

describe('isConstantValue', () => {
  it('should return true for string', () => {
    expect(isConstantValue<string>('')).toBe(true);
    expect(isConstantValue<string>('string')).toBe(true);
  });

  it('should return true for number', () => {
    expect(isConstantValue<number>(123)).toBe(true);
    expect(isConstantValue<number>(0)).toBe(true);
  });

  it('should return true for boolean', () => {
    expect(isConstantValue<boolean>(true)).toBe(true);
    expect(isConstantValue<boolean>(false)).toBe(true);
  });

  it('should return true for undefined/null', () => {
    expect(isConstantValue<string>(null)).toBe(true);
    expect(isConstantValue<string>(undefined)).toBe(true);
  });

  it('should return true for array', () => {
    expect(isConstantValue<any>([])).toBe(true);
  });

  it('should return true for object', () => {
    expect(isConstantValue<any>({})).toBe(true);
  });

  it('should return false for statement', () => {
    expect(isConstantValue<any>(['$if', ['$eq', 1, 1]])).toBe(false);
    expect(isConstantValue<any>(['$get', 'prop.prop'])).toBe(false);
    expect(isConstantValue<any>(['$switch', ['$get', 'prop.prop'], ['water', 'water']])).toBe(false);
    expect(isConstantValue<any>(['$eq', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$==', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$neq', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$!=', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$lt', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$<', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$lte', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$<=', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$gt', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$>', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$gte', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$>=', 1, 1])).toBe(false);
    expect(isConstantValue<any>(['$or', true, true])).toBe(false);
    expect(isConstantValue<any>(['$||', true, true])).toBe(false);
    expect(isConstantValue<any>(['$and', true, true])).toBe(false);
    expect(isConstantValue<any>(['$&&', true, true])).toBe(false);
    expect(isConstantValue<any>(['$oneOf', 'val', 'val1', 'val2'])).toBe(false);
    expect(isConstantValue<any>(['$empty', 1])).toBe(false);
    expect(isConstantValue<any>(['$notEmpty', 1])).toBe(false);
  });
});

describe('getPropertyValue', () => {
  const object = {
    0: 'value0',
    a: {
      b: 'value1',
      c: {
        d: 'value2',
      },
      e: [1, 'value3', 3],
    },
    f: 'value4',
  };

  it('should return value from property', () => {
    expect(getPropertyValue<string>(object, 0)).toBe('value0');
    expect(getPropertyValue<string>(object, 'a.b')).toBe('value1');
    expect(getPropertyValue<string>(object, 'a.c.d')).toBe('value2');
    expect(getPropertyValue<string>(object, 'a.e.1')).toBe('value3');
    expect(getPropertyValue<string>(object, 'f')).toBe('value4');
  });

  it('should return undefined is property does not exit', () => {
    expect(getPropertyValue<string>(object, 'a.b.c')).toBeUndefined();
    expect(getPropertyValue<string>(object, 'noSuchProperty.noSuchProperty')).toBeUndefined();
  });

  it('should return object if property is null/undefined', () => {
    expect(getPropertyValue<string>(object)).toBe(object);
    expect(getPropertyValue<string>(object, null)).toBe(object);
  });

  it('should throw error if property is not number/string', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      getPropertyValue<string>(object, true);
    }).toThrowError('Cannot get value from: true');
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      getPropertyValue<string>(object, {});
    }).toThrowError('Cannot get value from: {}');
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      getPropertyValue<string>(object, []);
    }).toThrowError('Cannot get value from: []');
  });
});

describe('compileMathStatement', () => {
  it('should treat statement as a "$+" math statement', () => {
    expect(compileMathStatement(['$+', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(4);
  });

  it('should treat statement as a "$-" math statement', () => {
    expect(compileMathStatement(['$-', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(0);
  });

  it('should treat statement as a "$*" math statement', () => {
    expect(compileMathStatement(['$*', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(4);
  });

  it('should treat statement as a "$/" math statement', () => {
    expect(compileMathStatement(['$/', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(1);
  });

  it('should treat statement as a "pow" math statement', () => {
    expect(compileMathStatement(['$pow', ['$get', 'properties.level'], 3], SampleWaterFeature)).toBe(8);
  });

  it('should treat statement as a "sqrt" math statement', () => {
    expect(
      compileMathStatement(['$sqrt', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 9,
        },
      }),
    ).toBe(3);
  });

  it('should treat statement as a "abs" math statement', () => {
    expect(
      compileMathStatement(['$abs', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: -9,
        },
      }),
    ).toBe(9);

    expect(
      compileMathStatement(['$abs', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 9,
        },
      }),
    ).toBe(9);
  });

  it('should treat statement as a "floor" math statement', () => {
    expect(
      compileMathStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.5,
        },
      }),
    ).toBe(1);

    expect(
      compileMathStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.9,
        },
      }),
    ).toBe(1);

    expect(
      compileMathStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 2.1,
        },
      }),
    ).toBe(2);
  });

  it('should treat statement as a "ceil" math statement', () => {
    expect(
      compileMathStatement(['$ceil', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.5,
        },
      }),
    ).toBe(2);
  });

  it('should treat statement as a "round" math statement', () => {
    expect(
      compileMathStatement(['$round', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.7,
        },
      }),
    ).toBe(2);

    expect(
      compileMathStatement(['$round', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.3,
        },
      }),
    ).toBe(1);
  });

  it('should treat statement as a "exp" math statement', () => {
    expect(
      compileMathStatement(['$exp', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 2,
        },
      }),
    ).toBe(7.38905609893065);
  });

  it('should treat statement as a "sin" math statement', () => {
    expect(
      compileMathStatement(['$sin', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 2,
        },
      }),
    ).toBe(1);
  });

  it('should treat statement as a "cos" math statement', () => {
    expect(
      compileMathStatement(['$cos', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 0,
        },
      }),
    ).toBe(1);

    expect(
      compileMathStatement(['$cos', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI,
        },
      }),
    ).toBe(-1);
  });

  it('should treat statement as a "tan" math statement', () => {
    expect(
      compileMathStatement(['$tan', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 4,
        },
      }),
    ).toBe(0.9999999999999999);
  });

  it('should treat statement as a "ctg" math statement', () => {
    expect(
      compileMathStatement(['$ctg', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 4,
        },
      }),
    ).toBe(1.0000000000000002);
  });

  it('should treat statement as a "log" math statement', () => {
    expect(
      compileMathStatement(['$log', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.E,
        },
      }),
    ).toBe(1);
  });

  it('should treat statement as a "log2" math statement', () => {
    expect(
      compileMathStatement(['$log2', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 4,
        },
      }),
    ).toBe(2);
  });

  it('should treat statement as a "log10" math statement', () => {
    expect(
      compileMathStatement(['$log10', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 100,
        },
      }),
    ).toBe(2);
  });

  it('should treat statement as a "min" math statement', () => {
    expect(
      compileMathStatement(['$min', ['$get', 'properties.level'], 3], {
        ...SampleWaterFeature,
        properties: {
          level: 1,
        },
      }),
    ).toBe(1);
  });

  it('should treat statement as a "min" math statement', () => {
    expect(
      compileMathStatement(['$max', ['$get', 'properties.level'], 3], {
        ...SampleWaterFeature,
        properties: {
          level: 1,
        },
      }),
    ).toBe(3);
  });

  it('should treat statement as a "random" math statement', () => {
    const r1Value = compileMathStatement(['$random'], SampleWaterFeature);
    expect(r1Value >= 0).toBe(true);
    expect(r1Value <= 1).toBe(true);

    const r2Value = compileMathStatement(['$random', 2, 5], SampleWaterFeature);
    expect(r2Value >= 2).toBe(true);
    expect(r2Value <= 5).toBe(true);
  });
});

describe('compilePlusStatement', () => {
  it('should return result value for "+" math statement', () => {
    expect(compilePlusStatement(['$+', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(4);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compilePlusStatement([] as unknown as PlusStatement, SampleWaterFeature);
    }).toThrowError('PlusStatement is invalid: []');

    expect(() => {
      compilePlusStatement(['$+'] as unknown as PlusStatement, SampleWaterFeature);
    }).toThrowError('PlusStatement is invalid: ["$+"]');
  });
});

describe('compileMinusStatement', () => {
  it('should return result value for "-" math statement', () => {
    expect(compileMinusStatement(['$-', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(0);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileMinusStatement([] as unknown as MinusStatement, SampleWaterFeature);
    }).toThrowError('MinusStatement is invalid: []');

    expect(() => {
      compileMinusStatement(['$-'] as unknown as MinusStatement, SampleWaterFeature);
    }).toThrowError('MinusStatement is invalid: ["$-"]');
  });
});

describe('compileMultiplyStatement', () => {
  it('should return result value for "*" math statement', () => {
    expect(compileMultiplyStatement(['$*', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(4);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileMultiplyStatement([] as unknown as MultiplyStatement, SampleWaterFeature);
    }).toThrowError('MultiplyStatement is invalid: []');

    expect(() => {
      compileMultiplyStatement(['$*'] as unknown as MultiplyStatement, SampleWaterFeature);
    }).toThrowError('MultiplyStatement is invalid: ["$*"]');
  });
});

describe('compileDivisionStatement', () => {
  it('should return result value for "/" math statement', () => {
    expect(compileDivisionStatement(['$/', 2, ['$get', 'properties.level']], SampleWaterFeature)).toBe(1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileDivisionStatement([] as unknown as DivisionStatement, SampleWaterFeature);
    }).toThrowError('DivisionStatement is invalid: []');

    expect(() => {
      compileDivisionStatement(['$/'] as unknown as DivisionStatement, SampleWaterFeature);
    }).toThrowError('DivisionStatement is invalid: ["$/"]');
  });
});

describe('compilePowerStatement', () => {
  it('should return result value for "pow" math statement', () => {
    expect(compilePowerStatement(['$pow', ['$get', 'properties.level'], 3], SampleWaterFeature)).toBe(8);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compilePowerStatement([] as unknown as PowerStatement, SampleWaterFeature);
    }).toThrowError('PowerStatement is invalid: []');

    expect(() => {
      compilePowerStatement(['$pow'] as unknown as PowerStatement, SampleWaterFeature);
    }).toThrowError('PowerStatement is invalid: ["$pow"]');
  });
});

describe('compileSqrtStatement', () => {
  it('should return result value for "sqrt" math statement', () => {
    expect(
      compileSqrtStatement(['$sqrt', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 9,
        },
      }),
    ).toBe(3);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileSqrtStatement([] as unknown as SqrtStatement, SampleWaterFeature);
    }).toThrowError('SqrtStatement is invalid: []');

    expect(() => {
      compileSqrtStatement(['$sqrt'] as unknown as SqrtStatement, SampleWaterFeature);
    }).toThrowError('SqrtStatement is invalid: ["$sqrt"]');
  });
});

describe('compileAbsStatement', () => {
  it('should return result value for "abs" math statement', () => {
    expect(
      compileAbsStatement(['$abs', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: -9,
        },
      }),
    ).toBe(9);

    expect(
      compileAbsStatement(['$abs', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 9,
        },
      }),
    ).toBe(9);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileAbsStatement([] as unknown as AbsStatement, SampleWaterFeature);
    }).toThrowError('AbsStatement is invalid: []');

    expect(() => {
      compileAbsStatement(['$abs'] as unknown as AbsStatement, SampleWaterFeature);
    }).toThrowError('AbsStatement is invalid: ["$abs"]');
  });
});

describe('compileFloorStatement', () => {
  it('should return result value for "floor" math statement', () => {
    expect(
      compileFloorStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.5,
        },
      }),
    ).toBe(1);

    expect(
      compileFloorStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.9,
        },
      }),
    ).toBe(1);

    expect(
      compileFloorStatement(['$floor', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 2.1,
        },
      }),
    ).toBe(2);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileFloorStatement([] as unknown as FloorStatement, SampleWaterFeature);
    }).toThrowError('FloorStatement is invalid: []');

    expect(() => {
      compileFloorStatement(['$floor'] as unknown as FloorStatement, SampleWaterFeature);
    }).toThrowError('FloorStatement is invalid: ["$floor"]');
  });
});

describe('compileCeilStatement', () => {
  it('should return result value for "ceil" math statement', () => {
    expect(
      compileCeilStatement(['$ceil', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.5,
        },
      }),
    ).toBe(2);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileCeilStatement([] as unknown as CeilStatement, SampleWaterFeature);
    }).toThrowError('CeilStatement is invalid: []');

    expect(() => {
      compileCeilStatement(['$ceil'] as unknown as CeilStatement, SampleWaterFeature);
    }).toThrowError('CeilStatement is invalid: ["$ceil"]');
  });
});

describe('compileRoundStatement', () => {
  it('should return result value for "round" math statement', () => {
    expect(
      compileRoundStatement(['$round', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.7,
        },
      }),
    ).toBe(2);

    expect(
      compileRoundStatement(['$round', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 1.3,
        },
      }),
    ).toBe(1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileRoundStatement([] as unknown as RoundStatement, SampleWaterFeature);
    }).toThrowError('RoundStatement is invalid: []');

    expect(() => {
      compileRoundStatement(['$round'] as unknown as RoundStatement, SampleWaterFeature);
    }).toThrowError('RoundStatement is invalid: ["$round"]');
  });
});

describe('compileExpStatement', () => {
  it('should return result value for "exp" math statement', () => {
    expect(
      compileExpStatement(['$exp', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 2,
        },
      }),
    ).toBe(7.38905609893065);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileExpStatement([] as unknown as ExpStatement, SampleWaterFeature);
    }).toThrowError('ExpStatement is invalid: []');

    expect(() => {
      compileExpStatement(['$exp'] as unknown as ExpStatement, SampleWaterFeature);
    }).toThrowError('ExpStatement is invalid: ["$exp"]');
  });
});

describe('compileSinStatement', () => {
  it('should return result value for "sin" math statement', () => {
    expect(
      compileSinStatement(['$sin', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 2,
        },
      }),
    ).toBe(1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileSinStatement([] as unknown as SinStatement, SampleWaterFeature);
    }).toThrowError('SinStatement is invalid: []');

    expect(() => {
      compileSinStatement(['$sin'] as unknown as SinStatement, SampleWaterFeature);
    }).toThrowError('SinStatement is invalid: ["$sin"]');
  });
});

describe('compileCosStatement', () => {
  it('should return result value for "cos" math statement', () => {
    expect(
      compileCosStatement(['$cos', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 0,
        },
      }),
    ).toBe(1);

    expect(
      compileCosStatement(['$cos', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI,
        },
      }),
    ).toBe(-1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileCosStatement([] as unknown as CosStatement, SampleWaterFeature);
    }).toThrowError('CosStatement is invalid: []');

    expect(() => {
      compileCosStatement(['$cos'] as unknown as CosStatement, SampleWaterFeature);
    }).toThrowError('CosStatement is invalid: ["$cos"]');
  });
});

describe('compileTanStatement', () => {
  it('should return result value for "tan" math statement', () => {
    expect(
      compileTanStatement(['$tan', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 4,
        },
      }),
    ).toBe(0.9999999999999999);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileTanStatement([] as unknown as TanStatement, SampleWaterFeature);
    }).toThrowError('TanStatement is invalid: []');

    expect(() => {
      compileTanStatement(['$tan'] as unknown as TanStatement, SampleWaterFeature);
    }).toThrowError('TanStatement is invalid: ["$tan"]');
  });
});

describe('compileCtgStatement', () => {
  it('should return result value for "ctg" math statement', () => {
    expect(
      compileCtgStatement(['$ctg', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.PI / 4,
        },
      }),
    ).toBe(1.0000000000000002);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileCtgStatement([] as unknown as CtgStatement, SampleWaterFeature);
    }).toThrowError('CtgStatement is invalid: []');

    expect(() => {
      compileCtgStatement(['$ctg'] as unknown as CtgStatement, SampleWaterFeature);
    }).toThrowError('CtgStatement is invalid: ["$ctg"]');
  });
});

describe('compileLogStatement', () => {
  it('should return result value for "log" math statement', () => {
    expect(
      compileLogStatement(['$log', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: Math.E,
        },
      }),
    ).toBe(1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileLogStatement([] as unknown as LogStatement, SampleWaterFeature);
    }).toThrowError('LogStatement is invalid: []');

    expect(() => {
      compileLogStatement(['$log'] as unknown as LogStatement, SampleWaterFeature);
    }).toThrowError('LogStatement is invalid: ["$log"]');
  });
});

describe('compileLog2Statement', () => {
  it('should return result value for "log2" math statement', () => {
    expect(
      compileLog2Statement(['$log2', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 4,
        },
      }),
    ).toBe(2);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileLog2Statement([] as unknown as Log2Statement, SampleWaterFeature);
    }).toThrowError('Log2Statement is invalid: []');

    expect(() => {
      compileLog2Statement(['$log2'] as unknown as Log2Statement, SampleWaterFeature);
    }).toThrowError('Log2Statement is invalid: ["$log2"]');
  });
});

describe('compileLog10Statement', () => {
  it('should return result value for "log10" math statement', () => {
    expect(
      compileLog10Statement(['$log10', ['$get', 'properties.level']], {
        ...SampleWaterFeature,
        properties: {
          level: 100,
        },
      }),
    ).toBe(2);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileLog10Statement([] as unknown as Log10Statement, SampleWaterFeature);
    }).toThrowError('Log10Statement is invalid: []');

    expect(() => {
      compileLog10Statement(['$log10'] as unknown as Log10Statement, SampleWaterFeature);
    }).toThrowError('Log10Statement is invalid: ["$log10"]');
  });
});

describe('compileMinStatement', () => {
  it('should return result value for "min" math statement', () => {
    expect(
      compileMinStatement(['$min', ['$get', 'properties.level'], 3], {
        ...SampleWaterFeature,
        properties: {
          level: 1,
        },
      }),
    ).toBe(1);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileMinStatement([] as unknown as MinStatement, SampleWaterFeature);
    }).toThrowError('MinStatement is invalid: []');

    expect(() => {
      compileMinStatement(['$min'] as unknown as MinStatement, SampleWaterFeature);
    }).toThrowError('MinStatement is invalid: ["$min"]');
  });
});

describe('compileMaxStatement', () => {
  it('should return result value for "min" math statement', () => {
    expect(
      compileMaxStatement(['$max', ['$get', 'properties.level'], 3], {
        ...SampleWaterFeature,
        properties: {
          level: 1,
        },
      }),
    ).toBe(3);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileMaxStatement([] as unknown as MaxStatement, SampleWaterFeature);
    }).toThrowError('MaxStatement is invalid: []');

    expect(() => {
      compileMaxStatement(['$max'] as unknown as MaxStatement, SampleWaterFeature);
    }).toThrowError('MaxStatement is invalid: ["$max"]');
  });
});

describe('compileRandomStatement', () => {
  it('should return result value for "random" math statement', () => {
    const r1Value = compileRandomStatement(['$random'], SampleWaterFeature);
    expect(r1Value >= 0).toBe(true);
    expect(r1Value <= 1).toBe(true);

    const r2Value = compileRandomStatement(['$random', 2, 5], SampleWaterFeature);
    expect(r2Value >= 2).toBe(true);
    expect(r2Value <= 5).toBe(true);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileRandomStatement([] as unknown as RandomStatement, SampleWaterFeature);
    }).toThrowError('RandomStatement is invalid: []');

    expect(() => {
      compileRandomStatement(['$random', 1] as unknown as RandomStatement, SampleWaterFeature);
    }).toThrowError('RandomStatement is invalid: ["$random",1]');
  });
});
