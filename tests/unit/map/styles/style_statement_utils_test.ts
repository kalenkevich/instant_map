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
      })
    ).toBe('value');

    expect(
      compileStatement(123, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      })
    ).toBe(123);

    expect(
      compileStatement(true, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      })
    ).toBe(true);

    expect(
      compileStatement(false, {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      })
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
        }
      )
    ).toEqual({});

    expect(
      compileStatement([], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {},
      })
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
      })
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
      })
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
      })
    ).toBe('else result');
  });

  it('should compile $switch value', () => {
    const switchCaseStatement: SwitchCaseStatement<string> = [
      '$switch',
      ['$get', 'properties.class'],
      ['water', 'water case'],
      ['land', 'land case'],
      ['$default', 'default case'],
    ];

    expect(compileStatement(switchCaseStatement, SampleWaterFeature)).toBe('water case');
  });

  it('should throw an error otherwise', () => {
    expect(() => {
      // @ts-ignore
      compileStatement(['$and', 1, 1], {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
        properties: {
          class: 'water',
        },
      });
    }).toThrowError('Statement is invalid: ["$and",1,1]');
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
      })
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
      })
    ).toBe('else result');
  });

  it('should compile complex statement', () => {
    const thenStatement: Statement<string> = ['$get', 'properties.thenValue'];
    const elseStatement: Statement<string> = ['$get', 'properties.elseValue'];

    const orCondition1: OrCondition<string> = [
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
      })
    ).toBe('then result');

    const andCondition1: AndCondition<string> = [
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
      })
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
      })
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
      })
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
      })
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
      })
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
      })
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
      })
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
      'Switch statement is invalid, $default should be last case: ["$switch",["$get","properties.class"],["$default","blue"],["ocean","blue"]]'
    );
  });
});

describe('compileConditionStatement', () => {
  it('should treat statement as a feature value and cast it to boolean', () => {
    const featureValue: FeatureValue<string> = ['$get', 'properties.class'];

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
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should treat statement as an "$or" condition statement', () => {
    expect(
      compileConditionStatement(
        ['$or', ['$eq', ['$get', 'properties.maxzoom'], 6], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should treat statement as an "$oneOf" condition statement', () => {
    expect(
      compileConditionStatement(
        ['$oneOf', ['$get', 'properties.class'], 'water', 'land', 'transportation'],
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should treat statement as an "$has" condition statement', () => {
    expect(compileConditionStatement(['$has', 'properties.class'], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as an "$!" condition statement', () => {
    expect(compileConditionStatement(['$!', ['$eq', ['$get', 'properties.class'], 'land']], SampleWaterFeature)).toBe(
      true
    );
  });
});

describe('compileConditionStatementOrValue', () => {
  it('should treat statement as a feature value', () => {
    const featureValue: FeatureValue<string> = ['$get', 'properties.class'];

    expect(compileConditionStatementOrValue(featureValue, SampleWaterFeature)).toBe('water');
  });

  it('should treat statement as a constant value', () => {
    expect(compileConditionStatementOrValue('water', SampleWaterFeature)).toBe('water');
  });

  it('should treat statement as a "$eq" condition statement', () => {
    expect(compileConditionStatementOrValue(['$eq', ['$get', 'properties.class'], 'water'], SampleWaterFeature)).toBe(
      true
    );
  });

  it('should treat statement as an "$neq" condition statement', () => {
    expect(compileConditionStatementOrValue(['$neq', ['$get', 'properties.class'], 'grass'], SampleWaterFeature)).toBe(
      true
    );
  });

  it('should treat statement as a "$lt" condition statement', () => {
    expect(compileConditionStatementOrValue(['$lt', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(
      false
    );
  });

  it('should treat statement as a "$lte" condition statement', () => {
    expect(compileConditionStatementOrValue(['$lte', ['$get', 'properties.minzoom'], 0], SampleWaterFeature)).toBe(
      true
    );
  });

  it('should treat statement as a "$gt" condition statement', () => {
    expect(compileConditionStatementOrValue(['$gt', ['$get', 'properties.maxzoom'], 1], SampleWaterFeature)).toBe(true);
  });

  it('should treat statement as a "$gte" condition statement', () => {
    expect(compileConditionStatementOrValue(['$gte', ['$get', 'properties.maxzoom'], 5], SampleWaterFeature)).toBe(
      true
    );
  });

  it('should treat statement as an "$and" condition statement', () => {
    expect(
      compileConditionStatementOrValue(
        ['$and', ['$eq', ['$get', 'properties.maxzoom'], 5], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should treat statement as an "$or" condition statement', () => {
    expect(
      compileConditionStatementOrValue(
        ['$or', ['$eq', ['$get', 'properties.maxzoom'], 6], ['$eq', ['$get', 'properties.minzoom'], 0]],
        SampleWaterFeature
      )
    ).toBe(true);
  });
});

describe('compileEqualCondition', () => {
  const SampleTrueEqualCondition: EqualCondition<number> = ['$eq', ['$get', 'properties.maxzoom'], 5];
  const SampleFalseEqualCondition: EqualCondition<number> = ['$eq', ['$get', 'properties.maxzoom'], 4];

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
      compileEqualCondition(['$eq'] as unknown as EqualCondition<number>, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$eq"]');

    expect(() => {
      compileEqualCondition(['$=='] as unknown as EqualCondition<number>, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$=="]');

    expect(() => {
      compileEqualCondition(['$==', 1, 2, 3] as unknown as EqualCondition<number>, SampleWaterFeature);
    }).toThrowError('EqualCondition statement is invalid: ["$==",1,2,3]');
  });
});

describe('compileNotEqualCondition', () => {
  const SampleTrueNotEqualCondition: NotEqualCondition<number> = ['$neq', ['$get', 'properties.maxzoom'], 4];
  const SampleFalseNotEqualCondition: NotEqualCondition<number> = ['$neq', ['$get', 'properties.maxzoom'], 5];

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
      compileNotEqualCondition(['$neq'] as unknown as NotEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$neq"]');

    expect(() => {
      compileNotEqualCondition(['$!='] as unknown as NotEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$!="]');

    expect(() => {
      compileNotEqualCondition(['$!=', 1, 2, 3] as unknown as NotEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('NotEqualCondition statement is invalid: ["$!=",1,2,3]');
  });
});

describe('compileLessCondition', () => {
  const SampleTrueLessCondition: LessCondition<number> = ['$lt', ['$get', 'properties.maxzoom'], 6];
  const SampleFalseLessCondition: LessCondition<number> = ['$lt', ['$get', 'properties.maxzoom'], 1];

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
      compileLessCondition(['$<'] as unknown as LessCondition<number>, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$<"]');

    expect(() => {
      compileLessCondition(['$lt'] as unknown as LessCondition<number>, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$lt"]');

    expect(() => {
      compileLessCondition(['$lt', '1', '2', '3'] as unknown as LessCondition<number>, SampleWaterFeature);
    }).toThrowError('LessCondition statement is invalid: ["$lt","1","2","3"]');
  });
});

describe('compileLessOrEqualCondition', () => {
  const SampleTrueLessOrEqualCondition: LessOrEqualCondition<number> = ['$lte', ['$get', 'properties.minzoom'], 0];

  const SampleFalseLessOrEqualCondition: LessOrEqualCondition<number> = ['$lte', ['$get', 'properties.maxzoom'], 4];

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
      compileLessOrEqualCondition(['$<='] as unknown as LessOrEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$<="]');

    expect(() => {
      compileLessOrEqualCondition(['$lte'] as unknown as LessOrEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$lte"]');

    expect(() => {
      compileLessOrEqualCondition(
        ['$lte', '1', '2', '3'] as unknown as LessOrEqualCondition<number>,
        SampleWaterFeature
      );
    }).toThrowError('LessOrEqualCondition statement is invalid: ["$lte","1","2","3"]');
  });
});

describe('compileGreaterCondition', () => {
  const SampleTrueGreaterCondition: GreaterCondition<number> = ['$gt', ['$get', 'properties.maxzoom'], 1];

  const SampleFalseGreaterCondition: GreaterCondition<number> = ['$gt', ['$get', 'properties.maxzoom'], 5];

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
      compileGreaterCondition(['$>'] as unknown as GreaterCondition<number>, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$>"]');

    expect(() => {
      compileGreaterCondition(['$gt'] as unknown as GreaterCondition<number>, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$gt"]');

    expect(() => {
      compileGreaterCondition(['$gt', '1', '2', '3'] as unknown as GreaterCondition<number>, SampleWaterFeature);
    }).toThrowError('GreaterCondition statement is invalid: ["$gt","1","2","3"]');
  });
});

describe('compileGreaterOrEqualCondition', () => {
  const SampleTrueGreaterOrEqualCondition: GreaterOrEqualCondition<number> = [
    '$gte',
    ['$get', 'properties.maxzoom'],
    1,
  ];

  const SampleFalseGreaterOrEqualCondition: GreaterOrEqualCondition<number> = [
    '$gte',
    ['$get', 'properties.maxzoom'],
    6,
  ];

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
      compileGreaterOrEqualCondition(['$>='] as unknown as GreaterOrEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$>="]');

    expect(() => {
      compileGreaterOrEqualCondition(['$gte'] as unknown as GreaterOrEqualCondition<number>, SampleWaterFeature);
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$gte"]');

    expect(() => {
      compileGreaterOrEqualCondition(
        ['$gte', '1', '2', '3'] as unknown as GreaterOrEqualCondition<number>,
        SampleWaterFeature
      );
    }).toThrowError('GreaterOrEqualCondition statement is invalid: ["$gte","1","2","3"]');
  });
});

describe('compileOrCondition', () => {
  const SampleTrueOrCondition: OrCondition<string> = [
    '$or',
    ['$eq', ['$get', 'properties.class'], 'water'],
    ['$eq', ['$get', 'properties.subClass'], 'sea'],
  ];

  const SampleFalseOrCondition: OrCondition<string> = [
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
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should accept "$||" as an function name', () => {
    expect(
      compileOrCondition(
        ['$||', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileOrCondition(['$or'] as unknown as OrCondition<string>, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$or"]');

    expect(() => {
      compileOrCondition(['$||'] as unknown as OrCondition<string>, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$||"]');

    expect(() => {
      compileOrCondition(['$or', '1', '2', '3'] as unknown as OrCondition<string>, SampleWaterFeature);
    }).toThrowError('OrCondition statement is invalid: ["$or","1","2","3"]');
  });
});

describe('compileAndCondition', () => {
  const SampleTrueAndCondition: AndCondition<string> = [
    '$and',
    ['$eq', ['$get', 'properties.class'], 'water'],
    ['$eq', ['$get', 'properties.subClass'], 'ocean'],
  ];

  const SampleFalseAndCondition: AndCondition<string> = [
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
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should accept "$&&" as an function name', () => {
    expect(
      compileAndCondition(
        ['$&&', ['$eq', ['$get', 'properties.class'], 'water'], ['$eq', ['$get', 'properties.subClass'], 'ocean']],
        SampleWaterFeature
      )
    ).toBe(true);
  });

  it('should throw an error when condition statement is invalid', () => {
    expect(() => {
      compileAndCondition(['$and'] as unknown as AndCondition<string>, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$and"]');

    expect(() => {
      compileAndCondition(['$&&'] as unknown as AndCondition<string>, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$&&"]');

    expect(() => {
      compileAndCondition(['$&&', '1', '2', '3'] as unknown as AndCondition<string>, SampleWaterFeature);
    }).toThrowError('AndCondition statement is invalid: ["$&&","1","2","3"]');
  });
});

describe('compileOneOfCondition', () => {
  it('should return true for truthy "ONE OF" condition', () => {
    expect(
      compileOneOfCondition(['$oneOf', ['$get', 'properties.class'], 'water', 'land', 'buildings'], SampleWaterFeature)
    ).toBe(true);
  });

  it('should return false for falthy "ONE OF" condition', () => {
    expect(
      compileOneOfCondition(['$oneOf', ['$get', 'properties.class'], 'test', 'land', 'buildings'], SampleWaterFeature)
    ).toBe(false);
  });

  it('should throw error if statement is invalid', () => {
    expect(() => {
      compileOneOfCondition([] as unknown as OneOfCondition<string>, SampleWaterFeature);
    }).toThrowError('OneOfCondition is invalid: []');

    expect(() => {
      compileOneOfCondition(['$oneOf'] as unknown as OneOfCondition<string>, SampleWaterFeature);
    }).toThrowError('OneOfCondition is invalid: ["$oneOf"]');

    expect(() => {
      compileOneOfCondition(['$oneOf', 1] as unknown as OneOfCondition<string>, SampleWaterFeature);
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
      compileHasCondition([] as unknown as HasCondition<string>, SampleWaterFeature);
    }).toThrowError('HasCondition is invalid: []');

    expect(() => {
      compileHasCondition(['$has'] as unknown as HasCondition<string>, SampleWaterFeature);
    }).toThrowError('HasCondition is invalid: ["$has"]');
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
  const featureValue: FeatureValue<string> = ['$get', 'properties.class'];

  it('should return feature value', () => {
    expect(compileFeatureValueStatement(featureValue, SampleWaterFeature)).toBe('water');
  });

  it('should throw an error when eature statement is invalid', () => {
    expect(() => {
      compileFeatureValueStatement([] as unknown as FeatureValue<string>, SampleWaterFeature);
    }).toThrowError('FeatureValue statement is invalid: []');

    expect(() => {
      compileFeatureValueStatement(['$get'] as unknown as FeatureValue<string>, SampleWaterFeature);
    }).toThrowError('FeatureValue statement is invalid: ["$get"]');

    expect(() => {
      compileFeatureValueStatement(
        ['$get', 'test.property', 'unknown param'] as unknown as FeatureValue<string>,
        SampleWaterFeature
      );
    }).toThrowError('FeatureValue statement is invalid: ["$get","test.property","unknown param"]');

    expect(() => {
      compileFeatureValueStatement(
        ['$undefinedFunction', 'test.property', 'unknown param'] as unknown as FeatureValue<string>,
        SampleWaterFeature
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
      //@ts-ignore
      getPropertyValue<string>(object, true);
    }).toThrowError('Cannot get value from: true');
    expect(() => {
      //@ts-ignore
      getPropertyValue<string>(object, {});
    }).toThrowError('Cannot get value from: {}');
    expect(() => {
      //@ts-ignore
      getPropertyValue<string>(object, []);
    }).toThrowError('Cannot get value from: []');
  });
});
