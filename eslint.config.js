const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      ".expo/**",
      "android/**",
      "ios/**",
      "node_modules/**",
      "output/**",
      "tmp/**",
    ],
  },
]);
