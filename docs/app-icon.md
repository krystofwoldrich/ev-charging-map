# App icon

Generated with the built-in image generation tool on 2026-10-16. The selected master is `assets/images/icon.png`; Expo generates the native platform sizes. It is an opaque, unmasked square so the operating system supplies the final corner shape. The Android adaptive icon and web favicon use the same artwork.

The design follows [Apple’s app icon guidance](https://developer.apple.com/design/human-interface-guidelines/app-icons): one recognizable symbol, centered content, strong contrast, no text, and no baked corner mask. The launch screen uses a plain system-colored background to avoid presenting a separate branded loading screen.

## Final prompt

```text
Use case: logo-brand.
Asset type: finished iOS app icon artwork for an electric vehicle charging map, 1024 by 1024 pixels.
Primary request: a confident, beautifully simple charging-location symbol: one large solid white map pin with a bold lightning bolt cut out of its circular head. The bolt reveals the green background. The shape must be immediately readable at 40 pixels.
Composition: straight-on centered glyph, optically balanced, generous empty space. Pin occupies roughly 60 percent of canvas height, with a broad round head and softly rounded tip. Bolt is broad and has slightly softened corners.
Background: full-bleed opaque square, a restrained smooth emerald green to deep teal gradient. Clean crisp vector-like illustration, precise silhouette, excellent contrast.
Constraints: one icon only; no lettering, no watermark, no mockup, no surrounding frame, no rounded-square container or pre-rounded canvas corners. No roads, cars, plugs or secondary symbols. No shadows, glossy highlights, bevels, texture or simulated glass; iOS supplies the final system treatment. Fill all four corners of the square background.
```

A transparent foreground experiment was rejected because its edges and lightning cutout were not clean; it is not included in the app.

## Development variant — 2026-10-16

`assets/images/icon-dev.png` is a separate opaque 1024 × 1024 icon: violet/indigo charging pin with a visible **DEV** badge. Generated with the built-in image-generation tool using the release icon as the edit target, then resized with `sips`. The release image remains byte-for-byte unchanged (SHA-256 `627cd902d05303bf2a7afa396395d5791707086ddc4654f84e70a8c5f08cae24`).

Prompt:

> Use case: precise-object-edit. Asset type: iOS and Android development app icon, full square opaque image. Input image 1 is the existing EV Charging release icon and edit target. Create a clearly distinguishable development variant. Preserve the recognizable white charging map pin and lightning cutout, clean silhouette and polished minimal style. Change the background from green/teal to vivid violet transitioning to deep indigo. Slightly reduce and raise the white pin to leave space for a compact high-contrast white rounded badge centered near the bottom, safely inside the icon mask. Badge text exactly: DEV, uppercase bold dark indigo sans-serif, legible at small app-icon size. Full-bleed square background with no rounded outer corners, no transparency, no framing, no extra text or watermark. Related to the original but unmistakably the development app.
