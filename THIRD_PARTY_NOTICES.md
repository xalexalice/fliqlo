# Third-party notices

Classic Flip bundles FlipClock.js 1.0.1 (MIT, Copyright 2013 Objective HTML, LLC)
from https://github.com/objectivehtml/FlipClock, plus its browser dependencies:
date-fns (MIT), goober (MIT), and SolidJS (MIT).

The build copies the complete license texts into both the standalone flip HTML
and `public/standalone/THIRD_PARTY_LICENSES.txt`.
No ClockTab source or DS-Digital shareware fonts are copied into this project.
Orbit, Mono, Dawn, and Terminal are original
implementations; Orbit does not bundle react-clock.

`fliqlo.html` is the original user-provided file. Its external resources are
retained as supplied: Tailwind CDN and Google Fonts. Its bytes and upstream
licensing status are not changed. The supplied `public/assets/logo.png` remains
the user's asset and is excluded from the project's MIT grant.

## Additional approved clock designs

The following MIT projects are adapted into native HTML/CSS/SVG faces with
Still's shared clock settings. Complete source revisions are recorded in
`src/data/clock-sources.json`; the corresponding copyright and license texts
are stored in `licenses/`, embedded in each affected HTML, and included in
`standalone/THIRD_PARTY_LICENSES.txt`.

| Face | Source | Copyright |
| --- | --- | --- |
| Station | https://github.com/danielpradilla/d3clock | 2015 Daniel Pradilla |
| Neumorphic | https://github.com/RayJason/Neumorphism_Clock | 2020 RayJason |
| Roman, Chronograph | https://github.com/zumerlab/orbit-kit | 2026 Juan Martin Muda — Zumerlab |
| Aura | https://github.com/anoopxa/Digital-clock | 2026 Anoop |
| Rolling | https://github.com/den4md/Animated-Clock-Wallpaper | 2024 Denis Staritin |
| Bubble | https://github.com/ducafecat/flutter_tiqlo_clock | 2026 ducafecat |
| Nixie | https://github.com/rajtilak-2020/Nixie-Tube-Clock | 2024 K Rajtilak |

These adaptations do not bundle D3, React, Orbit, Flutter, or LivelyWallpaper.
Nixie retains the MIT CSS tube artwork; its external LCD font is replaced
with unmodified DSEG7 Classic 0.46.0 under SIL OFL 1.1. Its small side display
shows seconds; 12-hour AM/PM appears below the face with the shared controls.
The rolling animation also respects the browser's reduced-motion preference.

## Embedded fonts

Fredoka Medium (Bubble), Space Mono Bold (Aura), Victor Mono Regular (Rolling),
and DSEG7 Classic Regular (Nixie) are unmodified SIL OFL 1.1 fonts.
Their license texts are retained in `licenses/*-OFL.txt`, and embedded in
the affected standalone HTML. Files, source links, and SHA-256 checksums are
recorded in `src/data/clock-fonts.json`. Gallery previews load the same local
font files; standalone clocks embed only the font required by that face.
