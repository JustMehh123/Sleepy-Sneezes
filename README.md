# Sleepy Sneezes

Arcade pixel platformer. Serve the folder (any static HTTP server) and open it — no build step.

```
python3 -m http.server 8080
```

Then open the site. **Shift/E** sneeze · **F** dash · **WASD** move.

```
assets/sprites/   player, enemies, tiles, boss sheets
css/arcade.css    CRT scanlines + cabinet frame
js/engine.js      loop, input, lighting
js/game.js        gameplay
js/levels.js      stages
js/audio.js       SFX
js/main.js        boot
tools/make_sprites.py  rebuild sheets
```

The world stays dim; Sleepyhead carries a lantern radius. Scanlines sit on top like a cabinet CRT.
