import { Renderer, Input, loadImage } from "./engine.js";
import { SoundFX } from "./audio.js";
import { Game } from "./game.js";

async function boot() {
    const canvas = document.getElementById("game");
    const renderer = new Renderer(canvas);
    const input = new Input();
    const sound = new SoundFX();
    const [player, enemies, tiles, boss] = await Promise.all([
        loadImage("assets/sprites/player.png"),
        loadImage("assets/sprites/enemies.png"),
        loadImage("assets/sprites/tiles.png"),
        loadImage("assets/sprites/boss.png")
    ]);
    const game = new Game(renderer, input, sound, { player, enemies, tiles, boss });
    const kick = () => sound.init();
    window.addEventListener("keydown", kick, { once: true });
    window.addEventListener("pointerdown", kick, { once: true });
    game.tick();
}

boot().catch((err) => {
    console.error(err);
    document.body.insertAdjacentHTML("beforeend", "<p style='color:#f88;font-family:monospace;padding:20px'>Failed to load sprites. Serve the folder over HTTP.</p>");
});
