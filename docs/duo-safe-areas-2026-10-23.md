# iPhone Duo safe-area verification — 2026-10-23

Expo's [SDK 58 Duo guidance](https://expo.dev/changelog/sdk-58#iphone-duo-support) recommends handling horizontal safe areas, including inside scroll views, and using native navigation where applicable. The installed `react-native-safe-area-context` 5.10.1 matches [Expo's recommended version](https://docs.expo.dev/versions/latest/sdk/safe-area-context/).

The map previously honored only the top inset for controls. The sheet used the presenting screen's bottom inset and no horizontal insets. With iOS SDK 27.1 edge-to-edge rendering, this put the recenter button and the expanded outer-display sheet's close button under the system rail.

The fix uses native `SafeAreaView` padding for the map controls and separate `SafeAreaProvider` boundaries inside TrueSheet's header and content. The sheet measures its own presentation rather than borrowing the full window's insets. Horizontal padding follows folding and resizing; the map background still fills the display. TrueSheet continues to manage bottom and keyboard scroll insets without an additional window-level bottom inset.

## Verification

Tested the development app `ch.woldri.evchargingmap.dev`, built locally with iOS SDK 27.1, on the running iPhone Duo simulator `767AB123-71E4-4E0A-B910-F21A0F95A382`. JavaScript was served by Metro on port 8087.

- Outer display (466 × 678 pt): recenter button moved to x=310–362; Settings close button moved to x=318–362. Both respond to taps outside the system rail.
- Outer expanded search: search field, Settings, and Cancel remain outside the rail with the keyboard visible; Cancel dismisses the keyboard.
- Outer station details: scrolling reaches both connectors, location, operator, and opening hours, with the final row above the screen edge.
- Folding from inner Settings to outer Settings updates padding without restarting; the close button works after folding.
- Unfolding while details are expanded and scrolled preserves content and restores the 480 pt sheet width without unnecessary horizontal padding.
- Inner display (951 × 669 pt): map/recenter control, Settings, details close button, and scroll content remain visible and usable. The map remains full screen.
- `npm run typecheck`, `npm run lint`, and `npm test` pass (25 tests).

Screenshots are saved locally under `.expo/qa/duo-safe-*.png` (ignored by Git). These checks cover the Duo simulator, not physical hardware. This JavaScript layout fix was verified through Metro; previously queued EAS builds predate it.
