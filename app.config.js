module.exports = ({ config }) => {
  const qaSurface = process.env.APP_RELAX_SURFACE === "qa";

  return {
    ...config,
    extra: {
      ...config.extra,
      buildSurface: qaSurface ? "qa" : "consumer",
      router: {
        ...config.extra?.router,
        root: qaSurface ? "src/app-qa" : "src/app",
      },
    },
  };
};
