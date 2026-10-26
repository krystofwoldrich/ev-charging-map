# Rotation support — 1.1.2

The previous build declared `orientation: portrait`. Version 1.1.2 uses Expo's
`default` orientation configuration and the root native stack's `orientation: all`.
Prebuild and the compiled simulator binary both contain portrait, upside-down
portrait, landscape left, and landscape right in their supported-orientation arrays.
The app does not lock rotation or select layout based on device orientation.

The search sheet's middle detent now grows in short windows, targeting at least
400 points where possible (capped at 90% of the window). Existing native safe-area
containers keep map controls and sheet content clear of the Duo's system controls.
Window dimensions update when rotating, folding, or resizing a window.

App/runtime versions are 1.1.2 (release) and 1.1.2-dev (development runtime).
These native configuration changes require new binaries, not an OTA for 1.1.1.
All EAS iOS profiles remain pinned to `macos-tahoe-26.6-xcode-27.1`.

## Validation

- TypeScript, ESLint, and all 25 existing tests passed.
- A fresh local Xcode 27.1 simulator build succeeded; its SDK is
  `iphonesimulator27.1`. Installed that binary, not the older EAS 1.1.1 build.
- On the dedicated conventional iPhone QA simulator (iOS 27.0), portrait and both
  landscape orientations rotate correctly. The map fills the window and the
  landscape search sheet exposes results and accessible settings/map buttons.
- Upside-down portrait was requested, but the conventional iPhone retained its
  previous landscape orientation. Apple documents that iPhones without a Home
  button do not support upside-down portrait. Declaring it in the app cannot
  override the device's restrictions.
- On the iPhone Duo simulator (iOS 27.1), opening/closing correctly resizes the
  app between outer 466×678 and inner 951×669 windows. Search, station details,
  and Settings remain accessible, with their local safe areas.
- **Duo rotation verification is incomplete.** Agent-device 0.21.25 reports
  successful orientation changes, but captures remain 466×678 outside and
  951×669 inside. The same command fails to rotate Apple's Settings app on this
  simulator, so these responses are not evidence of actual UI rotation. All four
  requested orientations were captured on each panel; no claim is made that all
  eight orientations passed. Native spatial-orientation monitoring also reports
  `Spatial orientation is not available on this device.`

Screenshots were captured with agent-device and are stored locally under
`.expo/qa/rotation-fix-1.1.2/` (ignored build/QA artifacts).

## Platform references

- [Apple: supportedInterfaceOrientations](https://developer.apple.com/documentation/uikit/uiviewcontroller/supportedinterfaceorientations)
  explains controller defaults and the upside-down limitation on modern iPhones.
- [Apple: prepare for iPhone Duo](https://developer.apple.com/iphone-duo/prepare/)
  recommends adapting to the current window rather than physical orientation.
- [Expo Router](https://docs.expo.dev/versions/latest/sdk/router/)
  documents the stack orientation option.

Prepared by Codex (gpt-6-astra).
