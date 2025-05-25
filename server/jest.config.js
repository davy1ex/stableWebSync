module.exports = {
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        "/node_modules/(?!lowdb|steno).+\\.js$"
    ],
    testEnvironment: "node",
  };