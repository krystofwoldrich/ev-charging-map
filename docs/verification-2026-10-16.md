# Expo SDK 58 verification — 2026-10-16

## Original app

The Plugsurfing public v4 API remains available without a configured API key. Live requests returned 48 Amsterdam stations and station details with connectors, availability, and EUR energy prices.

The original Expo 54 preview / React Native 0.81 app did not launch on iOS 27. After working around obsolete pod deployment targets to compile it, the process aborted in `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`. The SDK 58 native project includes the required scene lifecycle and launches successfully.

## Changes

- Upgraded to Expo 58.0.12, React Native 0.88.0, React 19.3.0, and compatible native modules; regenerated checked-in native projects and removed the obsolete RN patch.
- Replaced the experimental glass package with Expo Glass Effect and migrated the native connector menu and router imports.
- Restored the existing iOS app identity, `ch.woldri.evchargingmap`, in app config and the native project.
- Connected Type 2/CCS filtering to the API and cached station list; corrected viewport bounds and immutable cache updates.
- Propagated API/network failures to React Query, validated top-level response shapes, and fixed the details retry handler.
- Fixed safe-area placement, search/menu overlap, details accessibility, and location error handling.
- Added the development client and EAS simulator, App Store, and ad hoc development profiles.

## Verification

Used a newly created iPhone 17 Pro simulator on iOS 27.0, named **EV Charging Map QA iOS 27** (`44B75129-DE97-458E-A4E7-70CF69200876`). All device interactions used an isolated `agent-device` session; no shared Metro server was needed for Release testing.

Passed:

- TypeScript, ESLint, seven isolated API regression tests, iOS JS export, and Expo dependency compatibility check.
- Live station-list and station-details API smoke test.
- Native iOS Release build with Xcode 27.1 beta, without the original deployment-target workaround.
- Cold launch, location permission, map tiles, live markers/prices, station details and closing the sheet.
- Type 2 → CCS filter: only matching stations remain; verified TotalEnergies TNLP030017 details and 0.69 EUR/kWh price.
- Address search for Utrecht, selecting the result, loading Utrecht stations, and recentering on simulated Amsterdam location.
- Launch with location permission denied, then address search and station loading without location permission.
- Light/dark appearance; search suggestions no longer overlap the connector menu.

Expo Doctor passes 19/20 checks. The remaining warning is the deliberate checked-in native-project workflow: EAS builds native files as committed rather than automatically synchronizing app config. Regenerate native projects after native/config changes as described in the README.

Local screenshots, recorded interaction flow, environment notes, and the original crash report are in ignored `.expo/qa/`. API failure/retry behavior is covered by isolated tests; no live API outage was induced. Android and web runtime behavior were not manually tested. Dense price-marker overlap is existing behavior and remains.

## EAS builds

All use the existing EAS project and iOS bundle identifier. The App Store provisioning profile was renewed using an existing valid distribution certificate. The development profile includes the already-registered KWPhone.

| Profile | Build | Purpose |
| --- | --- | --- |
| simulator | [6c380aea](https://expo.dev/accounts/krystofwoldrich/projects/ev-charging-map/builds/6c380aea-f28e-48e6-ba0b-e5628ca31ff6) | Standalone simulator app |
| production | [a23820c6](https://expo.dev/accounts/krystofwoldrich/projects/ev-charging-map/builds/a23820c6-9ba0-4263-984a-83f028d2160f) | App Store archive, build 4, for TestFlight |
| development | [37b005e7](https://expo.dev/accounts/krystofwoldrich/projects/ev-charging-map/builds/37b005e7-b2db-421c-be51-be886470b8a4) | Ad hoc development client, build 5 |

All three EAS builds finished successfully. Downloaded and installed the EAS simulator artifact on the dedicated iOS 27 simulator; cold launch, location, live markers, CCS filtering, and station details passed. This artifact was built with the iOS 27.0 SDK.

Downloaded both device IPAs and inspected their bundle identifiers, build numbers, and embedded provisioning profiles: production is App Store-signed build 4; development is ad hoc build 5 with one registered device. Both profiles are valid until 2027-10-15. The upgraded app requires iOS 16.4 or later. The physical-device development client was built and inspected but was not run on KWPhone.

The production archive is suitable for submission to the existing app's TestFlight using EAS Submit.
