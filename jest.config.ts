import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  testTimeout: 60000,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'jsdom',
      transform: {
        '\\.tsx?$': 'ts-jest',
        '.+\\.glsl': 'jest-raw-loader',
        '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      },
      moduleNameMapper: {
        '.+\\.glsl': 'jest-raw-loader',
        '^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      },
      testMatch: ['<rootDir>/tests/unit/**/**_test.ts'],
      setupFiles: ['<rootDir>/tests/unit/setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'jest-puppeteer',
      transform: {
        '\\.tsx?$': 'ts-jest',
        '.+\\.glsl': 'jest-raw-loader',
        '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      },
      moduleNameMapper: {
        '.+\\.glsl': 'jest-raw-loader',
        '^.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      },
      testMatch: ['<rootDir>/tests/integration/**/**_test.ts'],
    },
  ],
};

export default config;
