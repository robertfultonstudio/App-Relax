const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      ".expo/**",
      "dist/**",
      "android/**",
      "ios/**",
      "node_modules/**",
      "output/**",
      "tmp/**",
      "public-pwa/flac-decoder.worker.min.js",
      // Byte-exact snapshot supplied by the verified Sites hosting handoff.
      "worker.mjs",
    ],
  },
]);
