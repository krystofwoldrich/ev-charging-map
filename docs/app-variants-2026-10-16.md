# Development and release app variants

The release identity remains `ch.woldri.evchargingmap` on iOS and `com.krystofwoldrich.evchargingmap` on Android. Development adds `.dev` to both identifiers, uses the display name **EV Charging Dev**, and uses the separate purple **DEV** icon. Each installation has independent app storage.

`app.json` remains the release source of truth. `app.config.js` adds development overrides only for `APP_VARIANT=development`; unknown variants fail early. EAS profiles select the variant explicitly. Generated native directories are no longer checked in, so EAS prebuild applies the correct configuration instead of inheriting a hard-coded release identifier. Native customization stays in config plugins.

The dev URL scheme is `evchargingmap-dev`. Expo's generated scheme is disabled for dev because the already-installed release owns `exp+ev-charging-map`. `npm start` selects the dev variant and explicit scheme. The dev runtime is `1.1.1-dev`, isolated from release runtime `1.1.1`.

## Checks

- 25 tests passed, including unchanged release config/icon, distinct dev IDs/scheme/runtime/icon, profile inheritance, and invalid variant rejection.
- TypeScript and lint passed; Expo Doctor passed all 20 checks.
- Generated both iOS and Android native projects for development, confirming the `.dev` IDs and dev-only URL scheme.
- Generated production again: release name, bundle ID, URL schemes, update configuration, and entitlements match the existing release. Generated release icon is byte-for-byte identical to the previous native icon.
- Original release asset SHA-256: `627cd902d05303bf2a7afa396395d5791707086ddc4654f84e70a8c5f08cae24`.

## EAS builds

Source commit: `d120c20`.

- [iOS simulator development client](https://expo.dev/accounts/krystofwoldrich/projects/ev-charging-map/builds/98e69884-be60-4d27-a94a-ba2354b61420) — **FINISHED**, version 1.1.1 (1).
- [iPhone development client](https://expo.dev/accounts/krystofwoldrich/projects/ev-charging-map/builds/f617b6a1-2091-4b3c-95d2-e7e5f3989236) — **FINISHED**, version 1.1.1 (3).

The physical-device build uses a new ad hoc provisioning profile for the dev identifier and the existing registered **KWPhone**. No release/TestFlight build or OTA update is replaced by this change.

```sh
npx --yes eas-cli@25.0.0 build --platform ios --profile development-simulator \
  --message 'Separate purple dev app alongside unchanged release — Codex (gpt-6-astra)' \
  --non-interactive --no-wait --json

npx --yes eas-cli@25.0.0 build --platform ios --profile development \
  --message 'Separate purple dev app for registered iPhones — Codex (gpt-6-astra)' \
  --no-wait

npm start -- --port 8087
```

The iPhone build required one interactive credential setup for the new bundle identifier; subsequent builds can reuse the stored credentials.

## Simulator verification

Installed the EAS artifact on the dedicated **EV Charging Map QA iOS 27** simulator (`44B75129-DE97-458E-A4E7-70CF69200876`) using `agent-device`. The original release was already installed and was not reinstalled or cleared.

- `agent-device apps` lists **EV Charging** (`ch.woldri.evchargingmap`) and **EV Charging Dev** (`ch.woldri.evchargingmap.dev`) simultaneously.
- The dev launch URL names **EV Charging Dev** in iOS's first-open confirmation and loads Metro on port 8087. The developer menu reports runtime `1.1.1-dev`.
- Dev starts with eight sample stations; the map and Amstel Riverside detail sheet work, including connectors, prices, and availability.
- Switching dev to live data loads real Plugsurfing stations. Relaunching release still shows its eight sample stations, proving the development preference did not overwrite release storage.
- Relaunching dev preserves its separate live-data preference; restored dev to sample mode after the check. The home screen shows the unchanged green release icon and the purple DEV icon together.
- Both downloaded artifacts declare the dev ID/display name and only `evchargingmap-dev` / `ch.woldri.evchargingmap.dev` URL schemes. The device IPA's signed provisioning profile matches `9734H7B7Y9.ch.woldri.evchargingmap.dev` and contains the registered iPhone.

QA screenshots are stored locally under `.expo/qa/variant-*.png` (ignored). Physical-device signing was inspected from the IPA; execution was tested on the iOS simulator.
