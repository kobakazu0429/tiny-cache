module.exports = /** @type {import("@jest/types").Config.InitialOptions} */({
  testMatch: [
    "**/*.test.ts"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
});
