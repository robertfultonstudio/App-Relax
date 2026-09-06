module.exports = {
  preset: "jest-expo",
  modulePathIgnorePatterns: [
    "<rootDir>/tmp/",
    "<rootDir>/dist/",
    "<rootDir>/output/",
  ],
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/app/**",
    "!src/audio/reactNativeAudioApi/**",
  ],
  moduleNameMapper: {
    "\\.(wav|flac|jpg|jpeg|png)$": "<rootDir>/tests/__mocks__/fileMock.ts",
  },
};
