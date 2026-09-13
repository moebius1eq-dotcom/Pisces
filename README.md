# PISCES

> Piece Together the Universe

PISCES is an interactive astronomy website I'm building to make learning
and exploring space feel more visual and interesting.

The project originally started as Cosmos Explorer, but I later redesigned
it into PISCES. 

## Why the name PISCES?

I chose PISCES because it sounds like "pieces," which fits my vision of having a jigsaw theme,
and Pisces is also my favorite constellation.

## What's the significance of the jigsaw theme? 

## What's the significance of the jigsaw theme?

Well, I am an anime and Marvel fan. I got inspired while watching Blue Lock,
where Isagi would piece together information and level up. I also implemented
some Marvel inspired visual details, such as putting different astronomy images
onto each jigsaw piece. This was inspired by the Marvel movie intros where
comic book pages and images of different characters rapidly appear.

## Current Features

- Cinematic jigsaw-piece entrance
- Astronomy images on puzzle pieces
- Interactive 3D space scenes
- Solar System journey
- Planet atlas
- Deep-space atlas

## Built With

- HTML
- CSS
- JavaScript
- Three.js

## AI Usage

I am still learning web development and used AI heavily for coding.

I came up with the concept and design direction, reviewed and tested the
results, debugged problems, and kept changing the implementation until it
matched my idea.

I am also using this project to learn how the code works.

## Running Locally

Run:

```bash
py -m http.server 8000
```

Then open:

http://localhost:8000

## Credits

### Libraries
- Three.js 0.170.0 — MIT License
  - License included in `vendor/three.LICENSE`

### Astronomy Images & Textures
- Earth imagery: NASA / Goddard Space Flight Center Scientific Visualization Studio, Blue Marble Next Generation
- Moon imagery: NASA Scientific Visualization Studio / LRO-LROC data
- Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Sun textures:
  Solar System Scope, licensed under CC BY 4.0
- Additional planet atlas images:
  NASA mission imagery
- PISCES entrance imagery:
  NASA and other astronomy sources listed in `assets/entrance-sources.json`

### Data
- Planetary physical data:
  NASA/JPL Solar System Dynamics

For detailed image source links and attribution information, see:
- `assets/entrance-sources.json`
- `assets/atlas-sources.json`

## Status

PISCES is still in development.

Currently I'm mainly focusing on the entrance/opening experience. (9/13/2026)