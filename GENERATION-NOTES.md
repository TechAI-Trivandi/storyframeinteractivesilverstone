# Silverstone continuous panorama correction — 9 October 2026

The original implementation blended a high-resolution source photograph into a different generated panorama according to the camera angle. That caused visible scene changes during rotation. This correction removes the photographic overlay and all angle-dependent image blending from both GPU and software rendering.

The renderer now samples one fixed 1774×887 generated Silverstone panorama for every direction. Its rear-edge feather is tied to fixed world coordinates, so it does not change a landmark as the camera turns. The photograph by Ben Sutherland remains the source reference credited in ASSET-SOURCES.md. The displayed panorama is a generated adaptation of that real reference; it is not the original photograph or a measured venue survey.

No new panorama was generated for this correction. The existing generated scene, live Silverstone phone artwork, destination, five-second timing, narrative, audio and phone transition are retained.
