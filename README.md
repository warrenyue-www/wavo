# Wavo Space Odyssey - First Draft

This is a tiny playable prototype for a two-person space game startup. It is built as a browser prototype so you can test the core loop immediately, and it includes Unity-ready scripts in `UnityPrototype/Assets/Scripts` for when Unity is installed.

## Play the browser prototype

Open `index.html` in a browser.

Controls:
- Move: `WASD` or arrow keys
- Aim: mouse
- Shoot: left mouse button or `Space`
- Dash: `Shift`
- Pause: `P`

Goal:
- Survive waves
- Destroy enemies and asteroids
- Collect blue energy
- Choose upgrades between waves

## Unity next step

1. Install Unity Hub.
2. Install Unity 6 LTS or the current recommended LTS version.
3. Create a new 2D URP project.
4. Copy `UnityPrototype/Assets/Scripts` into your Unity project's `Assets/Scripts`.
5. Create simple placeholder sprites:
   - Player ship
   - Bullet
   - Enemy drone
   - Asteroid
   - Energy pickup
6. Add the scripts to GameObjects following `UnityPrototype/SETUP.md`.

## What this draft proves

The current draft tests the first core loop:

Fly -> shoot -> survive -> collect energy -> upgrade -> harder wave.

Keep the first milestone small. If this loop is fun after 6 weeks of iteration, then expand into better art, better enemy behaviors, boss fights, Steam page work, and a vertical slice.
