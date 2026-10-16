# EV Charging Map

An Expo SDK 58 app that displays charging stations, availability, and prices from the public Plugsurfing API. Address search and current location use Expo Location. iOS uses Apple Maps through `react-native-maps`.

## Local development

Use Node 22.13+, 24.3+, or 26+, and Xcode 27 for iOS 27.

```sh
npm ci
npm run pod-install
npm run ios -- --device <simulator-udid> --port 8087
```

Use a dedicated simulator and an unused Metro port when other agents or projects are running. This app requires a native build; use the development client rather than Expo Go.

Native projects are checked in. After changing native dependencies or `app.json`, regenerate them and review the diff:

```sh
npx expo prebuild --clean --no-install
npm run pod-install
```

EAS builds the checked-in native projects rather than automatically applying app config. Expo Doctor warns about this intentionally retained workflow; keep app config and native files synchronized.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run check:api
npm run export -- --platform ios
npx expo-doctor
```

`npm test` runs isolated API regression tests. `npm run check:api` makes real requests for stations and details in central Amsterdam; it fails if the public endpoint is unavailable or incompatible. No API key is currently required. Availability and prices are supplied by Plugsurfing and may change.

On the simulator, verify launch, location permission, markers and station details, address search, Type 2/CCS filtering, current-location recentering, and error/retry behavior. Also verify launch with location permission denied.

## EAS builds

The iOS bundle identifier is `ch.woldri.evchargingmap`, matching the existing App Store Connect app. The EAS project belongs to `krystofwoldrich`.

```sh
# Standalone iOS simulator app
npx eas-cli@25.0.0 build --platform ios --profile simulator

# App Store-signed archive for TestFlight
npx eas-cli@25.0.0 build --platform ios --profile production

# Development client for registered physical iOS devices
npx eas-cli@25.0.0 build --platform ios --profile development
```

The production and development profiles increment the remote build number. A production build does not submit itself to TestFlight; submission is a separate `eas submit` step. TestFlight uses App Store distribution, while the development client uses internal/ad hoc distribution.
