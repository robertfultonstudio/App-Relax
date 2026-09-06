const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

for (const extension of ["wav", "flac"]) {
  if (!config.resolver.assetExts.includes(extension)) {
    config.resolver.assetExts.push(extension);
  }
}

function isFlacRequest(url) {
  if (!url) return false;
  try {
    return /\.flac(?:[?&]|$)/i.test(decodeURIComponent(url));
  } catch {
    return false;
  }
}

const defaultEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = defaultEnhanceMiddleware
    ? defaultEnhanceMiddleware(middleware, server)
    : middleware;
  return (request, response, next) => {
    if (isFlacRequest(request.url)) {
      const setHeader = response.setHeader.bind(response);
      response.setHeader = (name, value) =>
        setHeader(
          name,
          String(name).toLowerCase() === "content-type" ? "audio/flac" : value,
        );
      setHeader("Content-Type", "audio/flac");
    }
    return enhanced(request, response, next);
  };
};

module.exports = config;
