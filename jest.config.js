module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/app/**",
    "!src/audio/reactNativeAudioApi/**",
  ],
  moduleNameMapper: {
    "\\.(wav|jpg|jpeg|png)$": "<rootDir>/tests/__mocks__/fileMock.ts",
  },
};
