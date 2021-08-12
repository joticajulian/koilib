module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src/", "<rootDir>/tests/"],
  testMatch: ["**/?(*.|*-)+(spec|test).ts"],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(did-jwt))"],
  moduleFileExtensions: ["js", "json", "ts"],
  coverageDirectory: "./coverage/",
  collectCoverageFrom: ["src/**/*.(t|j)s", "!src/runtime/current/**/*.ts"],
  coverageReporters: ["text", "lcov", "json", "clover", "cobertura"],
};
