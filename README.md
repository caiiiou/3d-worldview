<div align="center">

# WORLDVIEW

**Satellite surveillance-themed 3D globe viewer**

![WORLDVIEW](https://ptpimg.me/zq2t07.png)

[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.119-blue?style=flat-square)](https://cesium.com/)
[![Astro](https://img.shields.io/badge/Astro-static_site-orange?style=flat-square)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-client_logic-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)

[Live Demo](https://worldview.james-ma.com) | [Quick Start](#quick-start) | [Controls](#controls)

</div>

---

## Features

- **Full-viewport 3D globe** -- terrain, 3D building tiles, and real-world elevation data
- **HUD overlay** -- MGRS coordinates, DMS readout, compass, classification markings, live clock
- **5 Vision Modes** -- Normal, CRT, Night Vision, FLIR, Anime (all GPU post-process shaders)
- **18 Locations** -- 9 US landmarks + 9 cities, one-click navigation with animated transitions
- **Smart Search** -- predictive autocomplete for saved locations + full address geocoding via Nominatim with auto-zoom from bounding box
- **Retractable UI** -- animated locations panel and HUD toggle with bouncy transitions
- **Performance tuned** -- throttled raycasting, 2GB tile cache, foveated loading, flight destination preloading, DOM caching

## Supported Browsers

Google Chrome, Apple Safari, and Microsoft Edge.

## Quick Start

```bash
npm install
npm run dev
```

Then open the URL shown in your terminal.

> Assets are fetched from their upstream providers at runtime. The app no longer installs an offline cache on client devices.

## Controls

| Key | Action |
|:---:|--------|
| `1` | Normal mode |
| `2` | CRT mode |
| `3` | Night Vision |
| `4` | FLIR mode |
| `5` | Anime mode |
| `Tab` | Toggle HUD visibility |
| `Enter` | Toggle locations panel |
| `Space` | Focus search bar |
| `Esc` | Unfocus search bar |

**Mouse:** drag to rotate, scroll to zoom, right-drag to tilt.

## Architecture

```text
src/pages/index.astro      Astro page shell and document structure
src/scripts/worldview.ts   client-side globe logic and interactions
public/styles.css          styling, animations, and theme rules
public/sw.js               cleanup worker that removes legacy service worker caches
public/favicon.svg         local high-resolution favicon asset
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Engine | CesiumJS v1.119 (CDN) |
| Shaders | Custom GLSL post-process stages |
| Geocoding | Nominatim (OpenStreetMap) |
| Fonts | Fira Code (Google Fonts) |
| Caching | Runtime provider/browser caching only |
| Framework | Astro |
| Language | TypeScript for bundled client logic |
| Build | Astro static build output |

## Credits

This project is built on top of several fantastic open-source and freely-available services. All the heavy lifting -- globe rendering, imagery, terrain, buildings, geocoding -- is done by these:

- **[CesiumJS](https://cesium.com/platform/cesiumjs/)** -- the open-source 3D globe and map engine. Everything you see rendered is powered by Cesium.
- **[Cesium ion](https://cesium.com/platform/cesium-ion/)** -- hosts the world terrain and streams the Google Photorealistic 3D Tiles (asset `2275207`) used for the city meshes and imagery.
- **[Google Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles)** -- the underlying photogrammetric building and terrain dataset served through Cesium ion.
- **[Nominatim](https://nominatim.org/) / [OpenStreetMap](https://www.openstreetmap.org/copyright)** -- free global geocoding for the search bar (&copy; OpenStreetMap contributors, ODbL).
- **[Google Fonts](https://fonts.google.com/) -- Fira Code** -- the monospace display font used throughout the HUD.

The HUD visuals, animations, vision-mode shaders, and UI code are original work, but none of the 3D data or rendering would exist without the projects above.

## Privacy

This app does not use cookies, analytics, or tracking. No user data is collected or stored. Your browser will connect directly to the following third-party services to load map data and assets:

- **Cesium ion** -- terrain and 3D tile streaming
- **Google** -- Photorealistic 3D Tiles and Fonts
- **OpenStreetMap / Nominatim** -- geocoding (search only)
