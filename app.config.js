module.exports = ({ config }) => {
  const requestedSurface = process.env.APP_RELAX_SURFACE;
  const buildSurface =
    requestedSurface === "qa"
      ? "qa"
      : requestedSurface === "pwa"
        ? "pwa"
        : "consumer";
  const routerRoot =
    buildSurface === "qa"
      ? "src/app-qa"
      : buildSurface === "pwa"
        ? "src/app-pwa"
        : "src/app";

  return {
    ...config,
    web: {
      ...config.web,
      favicon:
        buildSurface === "pwa"
          ? "./public-pwa/icons/favicon.png"
          : config.web?.favicon,
    },
    extra: {
      ...config.extra,
      buildSurface,
      router: {
        ...config.extra?.router,
        root: routerRoot,
      },
    },
  };
};
