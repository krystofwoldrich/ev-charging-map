const { withMod } = require('expo/config-plugins');

// SDK 58 removes the splash image view when no image is configured, but leaves
// its centering constraints in the storyboard. Keep the plain launch screen
// valid after every prebuild, without referencing a missing image view.
module.exports = function withPlainLaunchScreen(config) {
  return withMod(config, {
    platform: 'ios',
    mod: 'splashScreenStoryboard',
    action(config) {
      const document = config.modResults.document;
      for (const scene of document.scenes?.[0]?.scene ?? []) {
        for (const controller of scene.objects?.[0]?.viewController ?? []) {
          for (const view of controller.view ?? []) {
            const images = view.subviews?.[0]?.imageView ?? [];
            if (images.some((image) => image.$.id === 'EXPO-SplashScreen')) continue;
            for (const group of view.constraints ?? []) {
              group.constraint = (group.constraint ?? []).filter(
                ({ $: attributes }) =>
                  attributes.firstItem !== 'EXPO-SplashScreen' &&
                  attributes.secondItem !== 'EXPO-SplashScreen',
              );
            }
          }
        }
      }
      for (const resources of document.resources ?? []) {
        resources.image = (resources.image ?? []).filter(
          ({ $: attributes }) => attributes.name !== 'SplashScreenLogo',
        );
      }
      return config;
    },
  });
};
