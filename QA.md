# Verification — 9 October 2026

Passed:
- JavaScript syntax and required DOM references.
- Every configured local image exists and fully decodes. Local font and branding are included.
- Actual GLSL ES vertex/fragment shaders compile and link under Mesa GLES2.
- GPU frames rendered at 0°, 45°, 90°, 180°, 270°, 315° and 360°, visually reviewed.
- 0° and 360° frames match; rear wrap is numerically continuous; front and rear are distinct.
- Both pitch limits render opaque pixels rather than a blank environment.
- Software renderer and input simulation support more than two full horizontal turns without a clamp.
- No movement: eight seconds idle does not start the experience. Movement: 4.8 seconds remains in exploration; 5.1 seconds enables gathering.
- Gather, complete phone reveal, replay, reduced-motion reveal and dense phone filling pass in a simulated DOM with native Canvas.
- The native Enter StoryFrame anchor and runtime configuration both target https://storyframe.live/live/silverstone . Live titles, order and all eight phone assets are verified against the campaign data.
- Included MP3 atmosphere decodes as stereo audio. Silverstone has a 44-second crossfaded loop of actual F1 car passes.
- Complete ZIP entries, CRC integrity, image decode and local file references verified.

Visual decisions and limits:
- One scene texture is used for the full rotation. All camera-angle-dependent photo blending has been removed from the GPU and software renderer.
- The whole generated panorama is native 1774×887. Rear aisles have approximate symmetry; generated geometry and people are not verified.
- These are archival photographs and atmospheric still-image experiences. Cars/players in the photograph are not independently animated, and sound is not synchronized to them.
- A rendered spherical photograph offers rotational immersion, not positional 3D parallax.

Not claimed as tested: physical iOS/Android motion permissions and shake sensitivity, browser-specific audio behavior, or screenshots from a live browser. Drag/keyboard/tap fallback is included. Review on a real phone over HTTPS before a public launch.

Live Silverstone link and phone-page artwork connected on 9 October 2026. Phone reveal and destination activation rechecked after this update.

## Rotation regression correction

Actual GLES rendering confirms that the same fixed world direction keeps its color across 25 different camera headings, with a maximum tolerance of two channel values out of 255. Seven full-sphere headings and the 0°/360° return are checked again. This specifically tests the camera-dependent scene change reported by the user. The shader now has one scene sampler; the software path also samples only that one image.
