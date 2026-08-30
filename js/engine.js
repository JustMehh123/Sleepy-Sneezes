export const W = 800;
export const H = 450;

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export class Input {
    constructor() {
        this.keys = { Left: false, Right: false, Up: false, Down: false, Sneeze: false, Dash: false };
        this.pressSneeze = false;
        this.releaseSneeze = false;
        this.pressDash = false;
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyA" || e.code === "ArrowLeft") this.keys.Left = true;
            if (e.code === "KeyD" || e.code === "ArrowRight") this.keys.Right = true;
            if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") this.keys.Up = true;
            if (e.code === "KeyS" || e.code === "ArrowDown") this.keys.Down = true;
            if (e.code === "KeyF" || e.code === "KeyJ" || e.code === "ControlLeft" || e.code === "ControlRight") {
                if (!this.keys.Dash) this.pressDash = true;
                this.keys.Dash = true;
            }
            if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyE") {
                if (!this.keys.Sneeze) this.pressSneeze = true;
                this.keys.Sneeze = true;
            }
            if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
        });
        window.addEventListener("keyup", (e) => {
            if (e.code === "KeyA" || e.code === "ArrowLeft") this.keys.Left = false;
            if (e.code === "KeyD" || e.code === "ArrowRight") this.keys.Right = false;
            if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") this.keys.Up = false;
            if (e.code === "KeyS" || e.code === "ArrowDown") this.keys.Down = false;
            if (e.code === "KeyF" || e.code === "KeyJ" || e.code === "ControlLeft" || e.code === "ControlRight") this.keys.Dash = false;
            if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyE") {
                if (this.keys.Sneeze) this.releaseSneeze = true;
                this.keys.Sneeze = false;
            }
        });
    }
    endFrame() {
        this.pressSneeze = false;
        this.releaseSneeze = false;
        this.pressDash = false;
    }
}

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.world = document.createElement("canvas");
        this.world.width = W;
        this.world.height = H;
        this.wctx = this.world.getContext("2d");
        this.wctx.imageSmoothingEnabled = false;
        this.light = document.createElement("canvas");
        this.light.width = W;
        this.light.height = H;
        this.lctx = this.light.getContext("2d");
    }
    beginWorld() {
        const c = this.wctx;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, W, H);
        return c;
    }
    composite(playerX, playerY, shake) {
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#02010a";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.translate(Math.round(shake.x || 0), Math.round(shake.y || 0));

        const lc = this.lctx;
        lc.globalCompositeOperation = "source-over";
        lc.fillStyle = "rgba(4, 6, 18, 0.72)";
        lc.fillRect(0, 0, W, H);
        const g = lc.createRadialGradient(playerX, playerY, 20, playerX, playerY, 210);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.45, "rgba(0,0,0,0.15)");
        g.addColorStop(1, "rgba(0,0,0,0.72)");
        lc.globalCompositeOperation = "destination-out";
        lc.fillStyle = "#fff";
        const hole = lc.createRadialGradient(playerX, playerY, 8, playerX, playerY, 180);
        hole.addColorStop(0, "rgba(255,255,255,0.95)");
        hole.addColorStop(0.5, "rgba(255,255,255,0.45)");
        hole.addColorStop(1, "rgba(255,255,255,0)");
        lc.fillStyle = hole;
        lc.beginPath();
        lc.arc(playerX, playerY, 180, 0, Math.PI * 2);
        lc.fill();

        ctx.drawImage(this.world, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(this.light, 0, 0);

        ctx.fillStyle = "rgba(180, 190, 255, 0.03)";
        for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
        ctx.restore();
    }
}
