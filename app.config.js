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
    android: {
      ...config.android,
      blockedPermissions: [
        ...(config.android?.blockedPermissions ?? []),
        ...(process.env.EAS_BUILD_PROFILE === "preview-android"
          ? ["android.permission.SYSTEM_ALERT_WINDOW"]
          : []),
      ],
    },
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
