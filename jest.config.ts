import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  projects: [{
    displayName: 'unit',
    testEnvironment: 'jsdom',
    transform: {
      "\\.tsx?$": 'ts-jest',
      ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
    },
    moduleNameMapper: {
      "^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
    },
    testMatch: [
      "<rootDir>/tests/unit/**/**_test.ts",
    ],
  }, {
    displayName: 'integration',
    preset: "jest-puppeteer",
    transform: {
      "\\.tsx?$": 'ts-jest',
      ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
    },
    moduleNameMapper: {
      "^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
    },
    testMatch: [
      "<rootDir>/tests/integration/**/**_test.ts",
    ],
  }],
};

export default config;