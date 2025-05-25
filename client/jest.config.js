module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  

  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1"
  },

  transformIgnorePatterns: ['node_modules/(?!(some-module-to-transform)/)'],
};
