# EV Charging Map

An Expo SDK 58 charging map with native, resizable Liquid Glass sheets for search, station details, and Settings. iOS uses Apple Maps through `react-native-maps`.

**Sample data is enabled by default.** Settings → Use sample data switches between a fictional Amsterdam collection and the live public Plugsurfing API. Sample search and station details do not call the charging or geocoding APIs; map tiles still come from Apple Maps. Live address search and current location use Expo Location. The preference is saved on the device, and the two data sources have separate query caches.

## Local development

Use Node 22.13+, 24.3+, or 26+, and Xcode 27 for iOS 27.

```sh
npm ci
npm run ios -- --device <simulator-udid> --port 8087
```

Use a dedicated simulator and an unused Metro port when other agents or projects are running. This app requires a native build; use the development client rather than Expo Go.

Native projects use [Expo Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) and are ignored by Git. EAS generates them from `app.json`, `app.config.js`, and config plugins for the selected profile. Keep native customizations in config plugins, not generated files. The plain launch-screen fix lives in `plugins/withPlainLaunchScreen.js`.

The local `start`, `ios`, `android`, and `prebuild` scripts select the development variant. After changing native dependencies/config, or switching from a locally generated release project, regenerate before compiling:

```sh
npm run prebuild:clean
npm run ios -- --device <simulator-udid> --port 8087
```

For an installed EAS dev client, start Metro with `npm start -- --port 8087`. Its `evchargingmap-dev` URL scheme opens only the dev app, even alongside older releases that registered Expo's generated scheme. To generate release native projects locally, use `npm run prebuild:production`; switch back with `npm run prebuild:clean` before running local dev builds.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run check:api
npm run export -- --platform ios
npx expo-doctor
```

`npm test` covers API errors, sample data, tariff/hours processing, and update-switch success and failure paths. `npm run check:api` makes real requests for stations and details in central Amsterdam; it fails if the public endpoint is unavailable or incompatible. No API key is currently required. Availability and prices are supplied by Plugsurfing and may change.

On the simulator, verify launch, location permission, markers and station details, address search, Type 2/CCS filtering, current-location recentering, and error/retry behavior. Also verify launch with location permission denied.

## EAS builds

The EAS project belongs to `krystofwoldrich`. Development and release install side by side with independent app storage:

| Variant | iOS bundle identifier | Android application ID | Icon |
| --- | --- | --- | --- |
| Release / TestFlight | `ch.woldri.evchargingmap` | `com.krystofwoldrich.evchargingmap` | Existing green charging pin |
| EV Charging Dev | `ch.woldri.evchargingmap.dev` | `com.krystofwoldrich.evchargingmap.dev` | Purple charging pin with DEV badge |

`development` and `development-simulator` set `APP_VARIANT=development`; production, simulator, and preview profiles retain the release identity. With no variable, config defaults to the unchanged release. The dev runtime is `1.1.1-dev`, separate from release OTA updates. This follows [Expo's app variant guidance](https://docs.expo.dev/build-reference/variants/).

```sh
# Standalone iOS simulator app
npx eas-cli@25.0.0 build --platform ios --profile simulator

# App Store-signed archive for TestFlight
npx eas-cli@25.0.0 build --platform ios --profile production

# Development client for iOS simulators
npx eas-cli@25.0.0 build --platform ios --profile development-simulator

# Development client for registered physical iOS devices
npx eas-cli@25.0.0 build --platform ios --profile development
```

The production and development profiles increment the remote build number. A production build does not submit itself to TestFlight; submission is a separate `eas submit` step. TestFlight uses App Store distribution, while the development client uses internal/ad hoc distribution.


## Release version switching

Settings → App versions can load **Stable** (`production`), **Preview** (`preview`), or a named channel. Custom channels become recent choices. This is available in the standalone simulator and TestFlight builds; development clients use Metro instead.

The selector uses Expo Updates request-header overrides, inspired by [euxy's channel surfing](https://github.com/brentvatne/euxy/blob/main/src/lib/channel-surf.ts). It checks compatibility, downloads the update, saves the selected channel, fully dismisses the native sheet, and then reloads. Failed checks/downloads restore the previous channel. An empty or incompatible channel never replaces the current version. No account token or App Store credentials are shipped in the app.

Automatic update checks are disabled deliberately: the version you select stays loaded until you choose another update. Runtime version **1.1.1** identifies this native build, including the generated charging-pin icon. **Bump both the app version and runtime version whenever native dependencies or native configuration change**, regenerate native projects, and build new binaries. JavaScript-only updates can use the existing runtime. The icon source prompt and asset details are in [docs/app-icon.md](docs/app-icon.md).

```sh
# Publish a compatible preview (use a descriptive, signed message)
EXPO_PUBLIC_RELEASE_LABEL='Preview · Native sheets' npx eas-cli@25.0.0 update \
  --channel preview --environment preview --platform ios \
  --message 'Describe the change — author/model' --non-interactive

# Publish the stable channel
EXPO_PUBLIC_RELEASE_LABEL='Stable · Native sheets' npx eas-cli@25.0.0 update \
  --channel production --environment production --platform ios \
  --message 'Describe the change — author/model' --non-interactive

# Submit the exact production build to the existing App Store Connect app
npx eas-cli@25.0.0 submit --platform ios --profile production \
  --id <production-build-id> --non-interactive --wait
```

## Interface design

The shared TrueSheet uses the system's native sheet presentation and default Liquid Glass material on iOS 26+. Search, details, and Settings replace the sheet's content rather than stacking presentations. The map remains interactive at lower detents. System colors, SF Symbols, Dynamic Type, readable text, 44-point controls, and explicit availability labels follow Apple's guidance. Location permission is requested only when the live-mode location button is used. Missing opening hours remain unknown.

References: [Expo's Apple Maps sheet guide](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets), [TrueSheet Liquid Glass](https://sheet.lodev09.com/guides/liquid-glass), [Apple sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields), [materials](https://developer.apple.com/design/human-interface-guidelines/materials), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [typography](https://developer.apple.com/design/human-interface-guidelines/typography), and [Expo channel switching](https://docs.expo.dev/eas-update/channel-surfing/).
