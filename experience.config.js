// Live Silverstone hub and one fixed panorama for every viewing direction.
window.STORYFRAME_CONFIG = {
  "title": "StoryFrame · Silverstone",
  "description": "Look around Silverstone, gather its stories, and take the moment with you.",
  "destination": "https://storyframe.live/live/silverstone",
  "location": "SILVERSTONE · BRITISH GRAND PRIX",
  "scene": {
    "image": "./assets/silverstone-360.webp",
    "label": "Silverstone panorama generated from real race photography. Drag or use arrow keys to look around one continuous scene.",
    "projection": "equirectangular",
    "initialYaw": 0,
    "initialPitch": -0.08,
    "birds": false,
    "viewFov": 70
  },
  "timing": {
    "exploreSeconds": 5,
    "transitionSeconds": 7.6
  },
  "audio": {
    "src": "./assets/silverstone-race.mp3",
    "volume": 0.62,
    "windVolume": 0.025,
    "birds": false
  },
  "narrative": "Across the Northamptonshire countryside, the sound arrives before the cars. A rising engine note becomes a rush of colour, then disappears around the bend. Red and white kerbs trace the edge of the tarmac. Beyond the safety fence, flags lift above a sea of spectators. The grandstand watches the racing line, waiting for the next move. A family shares a pair of binoculars. A lifelong fan remembers another summer, another race, another impossible finish. The cars come around again. Each lap adds a little more to the story of this place. Speed passes in a heartbeat. Memories stay. Gather the voices, the journeys and the moments behind the race. StoryFrame puts the stories of Silverstone in your hands.",
  "phone": {
    "previewOnly": false,
    "label": "Preview of the live Silverstone StoryFrame page",
    "logo": "./assets/live/logo.webp",
    "background": "./assets/live/background.webp",
    "welcome": [
      "Welcome to",
      "Silver Stone!"
    ],
    "featured": {
      "title": "Welcome to Silverstone!",
      "image": "./assets/live/welcome.webp"
    },
    "categories": [
      {
        "title": "Live Today",
        "image": "./assets/live/category-0.webp"
      },
      {
        "title": "Around the Site",
        "image": "./assets/live/category-1.webp"
      },
      {
        "title": "Drivers and Rivals",
        "image": "./assets/live/category-2.webp"
      },
      {
        "title": "Cars and Rules",
        "image": "./assets/live/category-3.webp"
      },
      {
        "title": "The Circuit",
        "image": "./assets/live/category-4.webp"
      }
    ]
  }
};
