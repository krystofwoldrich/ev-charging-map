/** @param {import('expo/config').ConfigContext} context */
module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT ?? 'production';
  if (!['production', 'development'].includes(variant)) {
    throw new Error(`Unknown APP_VARIANT: ${variant}. Use production or development.`);
  }

  // app.json remains the unchanged release configuration.
  if (variant === 'production') return config;

  return {
    ...config,
    name: 'EV Charging Dev',
    icon: './assets/images/icon-dev.png',
    scheme: 'evchargingmap-dev',
    runtimeVersion: `${config.runtimeVersion}-dev`,
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
      infoPlist: { ...config.ios.infoPlist, CFBundleDisplayName: 'EV Charging Dev' },
    },
    android: {
      ...config.android,
      package: `${config.android.package}.dev`,
      adaptiveIcon: {
        ...config.android.adaptiveIcon,
        foregroundImage: './assets/images/icon-dev.png',
        backgroundColor: '#5B21B6',
      },
    },
    updates: {
      ...config.updates,
      requestHeaders: { ...config.updates.requestHeaders, 'expo-channel-name': 'development' },
    },
    plugins: [
      ...config.plugins,
      // The installed release already owns exp+ev-charging-map. Use our explicit
      // dev-only scheme so opening Metro never accidentally launches that app.
      ['expo-dev-client', { addGeneratedScheme: false }],
    ],
  };
};
