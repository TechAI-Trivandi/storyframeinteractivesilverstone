# StoryFrame · Silverstone Stadium — opening experience

Complete standalone static template. No npm dependencies, build step, account keys, or external runtime assets.

## Run locally

From this folder run `python3 -m http.server 8080`, then open `http://localhost:8080`.
Use an HTTP server instead of opening index.html as a local file: audio loading requires fetch.

## Deploy

**Vercel:** upload these files to a GitHub repository, import it into Vercel, choose Other, leave Build Command empty and use the repository root as the output. The included vercel.json is ready for a static deployment.

**GitHub Pages:** commit these files at the repository root, then enable Pages from that branch/root in repository Settings. All application asset paths are relative, including under a project subpath.

Use HTTPS for motion sensors on phones. On iOS, tap Enable phone movement to grant motion access. Drag, arrow keys and tap-to-gather remain available. Tap the visible Sound button to enable audio; browsers require that gesture.

## Experience

1. Opens directly in the scene. The timer remains paused until the visitor starts moving or dragging.
2. Full continuous 360-degree horizontal rotation, with up/down movement limited to comfortable viewing angles.
3. After five seconds of exploration: “Shake the phone to gather its stories.” Tap and desktop controls are also available.
4. The photograph softly resolves into words from a venue-specific story; those characters fill the entire phone before its UI appears.
5. Replay resets the experience. Reduced-motion preferences use a brief crossfade.

## Live StoryFrame page

The Enter StoryFrame button now opens https://storyframe.live/live/silverstone . The phone preview uses the live welcome title, logo, background, featured story and all five category titles/artwork in their current order, captured 9 October 2026. Both the phone UI and the character color map use the same assets.

To change the destination or refresh its phone artwork later, edit `experience.config.js` and replace the relevant files under `assets/live/`.

## Image quality and authenticity

The whole look-around now uses one fixed 1774×887 panorama. Turning changes only the camera direction. There is no separate starting photograph, image swap, or angle-dependent crossfade. The sphere was generated from Ben Sutherland's real 2010 British Grand Prix photograph, credited in `ASSET-SOURCES.md`; all displayed scenery is a generated adaptation, not a surveyed 360 capture. It does not retain the earlier high-resolution photographic overlay. Rear geometry is approximate, and there is no positional parallax or separately animated race action.

## Customize

Venue, scene, narration, timing, sound and phone are all configured in `experience.config.js`. Space Grotesk is served locally. This template retains StoryFrame's supplied logomark and wordmark. Keep the credits and font license when redistributing.

## Verification

See `QA.md` for checks performed and remaining device checks.
# storyframeinteractivesilverstone
