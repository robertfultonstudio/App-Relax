const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

for (const extension of ["wav", "flac"]) {
  if (!config.resolver.assetExts.includes(extension)) {
    config.resolver.assetExts.push(extension);
  }
}

module.exports = config;
