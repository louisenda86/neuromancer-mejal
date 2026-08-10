# Neuromancer V2.2 // The Chromatic Sprawl

A second-generation scroll-driven audiovisual field guide to *Neuromancer*.
One persistent Three.js world, seven authored camera movements, a playable
space-fighter encounter, seven live-synthesised Aulos scores, and no runtime
dependency on a third-party server.

Private site: https://neuromancer-chromatic-sprawl-v2.moailabs.chatgpt.site

Open `index.html` over HTTP (`npm start`) and scroll.

## How it works

**One world, one conductor.** There is a single WebGL scene and a single
normalised scroll state. Native `scrollY` becomes a fractional chapter value
such as `2.35`, split into two numbers:

- `rig.exact` — the precise document position. Drives the chapter rail, the
  readout, foreground ownership and anchor navigation, and updates
  synchronously in the scroll handler so the interface never lags a frame.
- `rig.smooth` — an exponentially damped copy. Drives the camera and world
  interpolation only. This split is why the camera can feel heavy while the
  navigation stays exactly correct.

The same scroll position reproduces the same frame forward, backward, after a
fast flick, after a resize, and after a reload at depth. V2 layers an authored
arc, lift, dolly, and camera bank into every segment, plus scroll-momentum
response and separate DOM depth planes for copy, plates, and scenery.

**The world is procedural.** Every texture, silhouette and cut-out is generated
on canvas at boot from seeded noise — board-formed concrete, stamped panel,
wet Ninsei asphalt with puddle roughness and clearcoat, worn neon signage,
alpha-tested holographic veils, and foreground scenery finished through a
dithered alpha-matte pass. Nothing visible in the experience is downloaded at
runtime and nothing is placeholder art.

**The palette comes from the supplied 1984 cover.** Typography, practical
lights, holograms, chapter accents and post-process halation use classic cyan
blue `#20a8d9`, grid green `#a8bd45`, process magenta `#f01570`, chalk white
`#e0dfd9`, and lavender gray `#6a6e8a` over charcoal `#080b0d`.

**Chapters are data.** Camera position, target, FOV, mobile override, fog
density and colour, key intensity, lattice, rain, motes, bloom and accent all
live in one ledger and are interpolated from the same progress value.

## Chapters

| # | Chapter | Composition |
|---|---------|-------------|
| 00 | Entry | wide establishing shot over the Sprawl |
| 01 | The Matrix | push into nonspace toward the core |
| 02 | Chiba City | street level, wet Ninsei, static rain |
| 03 | The Run | lateral travel along the ICE conduit |
| 04 | Machine Ghosts | close on the dithered construct |
| 05 | Afterimage | rise to the Freeside spindle |
| 06 | Appendix | departing pullback over the whole world |

## Effects

- **Decrypt reveal** — following [canvasui.dev](https://canvasui.dev/docs/components/decrypt-reveal).
  Headings and technical labels resolve through a cipher wavefront on arrival.
  Each chapter plate renders as an ASCII cipher that decrypts around the
  cursor, with a flickering, chromatically split wavefront. Touch devices get
  a drifting wavefront, since a coarse pointer never hovers.
- **Ordered dithering** — one Bayer 4×4 matrix shared by three surfaces: the
  arcology facades, the construct in chapter 04, and the final composite.
- **Post chain** — linear half-float buffer → bright pass → separable blur →
  accent-tinted print halation → ACES → vignette → chromatic aberration → dither.
- **Foreground cut-outs** — true-alpha scenery parked in each section, softened
  and Bayer-resolved through a generated matte, then depth-shifted while its
  chapter owns the viewport.
- **Adaptive fill rate** — scene density is preserved; only render resolution
  steps down once when a device proves unable to hold the intended camera feel.
- **Liquid masthead** — the two-line `NEURO / mancer` title is rasterised to a
  responsive canvas and displaced in live horizontal bands wherever the cursor
  or touch energy crosses it.
- **Clean-first finish** — the first frame is sharp and unprocessed. Grain and
  VHS scan/chroma/dropout are independent opt-in layers, while Light mode
  remaps the interface and 3D exposure without rebuilding the world.
- **Page 00 dogfight** — two procedural space fighters bank, chase, shoot and
  leave emissive laser trails. Take control with a double-click or the HUD.
- **FIG.02—05 motion graphics** — transparent telemetry canvases add rain
  scans, route pulses, a machine iris and orbital traces above the decrypted
  chapter stills. Their energy follows the live audio analyser.
- **Audio-reactive world** — bass, mid and high envelopes independently drive
  the matrix grid, motes, construct amplitude, practical lights, bloom and
  chromatic response for both the generated score and local music.

## Controls

- Play with the transport, `Space` or `M`; chapter scores with `1`–`7`
- **Scores** lists all seven cross-fading Aulos arrangements
- **Load audio** accepts a local MP3 or WAV, routes it through the analyser and
  keeps the file entirely on the device
- **Grain**, **VHS** and **Light mode** are optional visual treatments; the
  default opening remains clean HD
- On page 00, double-click to take control, steer with pointer or arrow keys,
  click to fire, and press `Escape` to release the fighter
- **Auto drift** releases pointer parallax; **ICE layer** hardens the
  countermeasure; **Breach** fires a transport glitch
- The Aulos score starts after the first scroll or gesture, follows the active
  page from 00–06, and cross-fades whenever the next page takes focus
- Query the local ROM with `matrix`, `case`, `molly`, `aulos`, `ice`,
  `wintermute`, `chiba`, `straylight`, `help`

## Accessibility and failure

Complete heading hierarchy, landmarks, skip link, visible focus, and full
`aria-label` text preserved behind every split or enciphered heading. Reduced
motion snaps the camera to composed chapters, shows the plates decrypted and
still, and keeps the entire reading experience. If WebGL is unavailable a
composed poster stands in and the document is unaffected.

Reveals, decrypts and foreground hand-offs all carry a fail-safe: if the
animation frame never arrives — hidden tab, throttled webview, dropped
transition — the final state is written directly. Nothing depends on a frame
to become readable.

## Assets

Everything is local and referenced by relative path, so the site works from a
GitHub Pages subpath:

```
vendor/three.module.min.js   Three.js r179 (ESM)
vendor/three.core.min.js     its core chunk
vendor/fonts.css             Space Grotesk / Instrument Serif / DM Mono, latin
vendor/*.woff2               the eight faces those three families need
public/og.png                 bespoke 1200 × 627 social preview
```

No CDN, no remote fonts, no analytics, no trackers, no build step for the page
itself.

## Scripts

```bash
npm start     # serve on http://localhost:4181
npm run check # parse every inline script and report the line of any error
npm run build # emit the Cloudflare Worker bundle to dist/server/index.js
```

`npm run check` exists because a broken inline module fails silently: the page
still returns 200 and simply never boots.

## Debug surface

`window.__sprawl` exposes the conductor, the chapter ledger, the renderer and
the plate fields, plus `goTo(i)`, `sample()` and `capture(w, h)` for inspecting
any composed frame without a screenshot.

## Sound

Seven default scores are generated live with the Web Audio API; no recorded
music ships with the site. User-selected MP3/WAV files play locally through a
shared frequency analyser.

1. **Entry Signal** — threshold drone and paired Dorian reeds
2. **Lattice Aulos** — ascending glass-reed cells in nonspace
3. **Ninsei Aulos** — wet breath, noir intervals and rain texture
4. **Pursuit Aulos** — rapid split-tongue figures against a driven drone
5. **Ghost Aulos** — phased polyreed lines and machine-response echoes
6. **Orbital Aulos** — long breath, wide harmony and slow signal bloom
7. **Exit Aulos** — a descending final breath into the appendix

---

Independent editorial study, 2026. Not affiliated with the author or publisher.
This page was built by MEJALISM CORP by louisendajapar™ · TM Registered.
