import { W, H } from "./engine.js";
import { buildLevels, makeEnemy, DEFAULT_THEME } from "./levels.js";

const ENEMY_FRAME = { bunny: 0, slime: 1, fox: 2, moth: 3, bat: 4, ogre: 5, scarecrow: 6, clockling: 7 };
const KANJI = ["斬", "撃", "滅", "破", "閃", "轟"];

export class Game {
    constructor(renderer, input, sound, sheets) {
        this.r = renderer;
        this.input = input;
        this.sound = sound;
        this.sheets = sheets;
        this.levels = buildLevels();
        this.state = "START";
        this.levelIndex = 0;
        this.time = 0;
        this.shake = { x: 0, y: 0, n: 0 };
        this.world = {};
        this.player = this.freshPlayer();
        this.floaters = [];
        this.particles = [];
        this.shockwaves = [];
        this.feathers = [];
        this.impact = { on: false, t: 0, px: 0, py: 0, fx: 0, fy: 0, fvx: 0, fvy: 0, kanji: "斬" };
        this.modal = { title: "", story: "", next: null };
        this.cheat = "";
    }

    freshPlayer() {
        return {
            x: 50, y: 300, w: 32, h: 40, vx: 0, vy: 0, speed: 3.2, gravity: 0.28,
            facing: 1, grounded: false, coyote: 0, gliding: false, slamming: false,
            charging: false, charge: 0, energy: 100, cooldown: 0,
            dashing: false, dashT: 0, dashCd: 0, dashX: 1, dashY: 0, dashHits: [],
            scaleX: 1, scaleY: 1, hp: 3, maxHp: 3, iFrames: 0, score: 0, pillows: 0, drop: 0
        };
    }

    boom(n) { this.shake.n = Math.max(this.shake.n, n); }
    say(x, y, text, color = "#e2e8f0") { this.floaters.push({ x, y, text, color, life: 45 }); }

    initLevel(i) {
        this.levelIndex = i;
        const p = this.player;
        p.x = 50; p.y = 300; p.vx = 0; p.vy = 0; p.hp = p.maxHp; p.energy = 100;
        p.cooldown = 0; p.charging = false; p.dashing = false; p.dashCd = 0; p.pillows = 0; p.iFrames = 0;
        this.world = { platforms: [], pillows: [], enemies: [], hazards: [], alarmClocks: [], boss: null, goalPost: null, bossProjectiles: [] };
        this.levels[i].setup(this.world);
        if (!this.world.bossProjectiles) this.world.bossProjectiles = [];
        this.state = "PLAY";
        this.impact.on = false;
        this.sound.stopChargeSound();
    }

    startDash() {
        const p = this.player;
        if (p.dashing || p.dashCd > 0 || p.charging) return;
        let dx = 0, dy = 0;
        if (this.input.keys.Left) dx -= 1;
        if (this.input.keys.Right) dx += 1;
        if (this.input.keys.Up) dy -= 1;
        if (this.input.keys.Down) dy += 1;
        if (dx === 0 && dy === 0) dx = p.facing;
        if (dx === 0 && dy > 0) { dx = p.facing; dy = 0; }
        const mag = Math.hypot(dx, dy) || 1;
        p.dashing = true; p.dashT = 12; p.dashCd = 32;
        p.dashX = dx / mag; p.dashY = dy / mag; p.dashHits = [];
        p.slamming = false; p.iFrames = Math.max(p.iFrames, 12);
        if (dx) p.facing = dx > 0 ? 1 : -1;
        this.sound.dashSound();
        this.boom(3);
        this.say(p.x, p.y - 16, "DASH!", "#a5b4fc");
    }

    dashHit(e) {
        const p = this.player;
        const low = e.hp <= 1 || e.stunned > 0 || e.hp / e.maxHp <= 0.34;
        if (low) {
            e.alive = false; e.hp = 0; p.score += 400;
            this.say(e.x, e.y - 16, "FINISH!", "#fde047");
            this.impact.on = true; this.impact.t = 48;
            this.impact.px = p.x + p.w / 2; this.impact.py = p.y + p.h / 2;
            this.impact.fx = e.x; this.impact.fy = e.y;
            this.impact.fvx = p.dashX * 14; this.impact.fvy = p.dashY * 10 - 4;
            this.impact.kanji = KANJI[Math.floor(Math.random() * KANJI.length)];
            this.sound.executeSound(); this.boom(16);
            return;
        }
        e.hp -= 1; e.flash = 8;
        if (e.strength >= 2) { e.stunned = 70; this.say(e.x, e.y - 12, "STUNNED!", "#fbbf24"); this.sound.hitSound(); }
        else { e.alive = false; p.score += 200; this.say(e.x, e.y - 12, "+200 DASH!", "#a5b4fc"); this.sound.stompSound(); }
    }

    releaseSneeze() {
        const p = this.player;
        if (!p.charging) return;
        p.charging = false; this.sound.stopChargeSound();
        const cr = Math.min(1, p.charge / 60);
        p.energy = Math.max(0, p.energy - (25 + cr * 40));
        p.cooldown = 120;
        p.vx = -p.facing * 7 * (1 + cr * 1.8);
        p.vy = -7 * (0.8 + cr);
        p.grounded = false; p.slamming = false;
        this.sound.sneezeSound(0.8 + cr); this.boom(4 + cr * 12);
        this.say(p.x, p.y - 22, cr > 0.8 ? "MEGA SNEEZE!" : "SNEEZE!", cr > 0.8 ? "#f43f5e" : "#818cf8");
        const radius = 80 + cr * 100;
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        this.world.alarmClocks.forEach((c) => {
            if (!c.rung && Math.hypot(cx - c.x, cy - c.y) < radius) {
                c.rung = true; this.sound.pillowSound();
                const dmg = Math.floor(30 + cr * 45);
                this.say(c.x, c.y - 16, "ALARM -" + dmg, "#fbbf24");
                if (this.world.boss) {
                    this.world.boss.hp -= dmg;
                    if (this.world.boss.hp <= 0) { this.world.boss.hp = 0; this.complete(); }
                }
            }
        });
        this.world.enemies.forEach((e) => {
            if (!e.alive) return;
            if (Math.hypot(cx - e.x, cy - e.y) < radius) {
                e.hp -= 1; e.flash = 8;
                if (e.hp <= 0) { e.alive = false; p.score += 200; this.say(e.x, e.y - 12, "+200 BLAST!", "#818cf8"); }
                else { e.stunned = 50; this.say(e.x, e.y - 10, "STUN!", "#fbbf24"); }
            }
        });
        if (this.world.boss) {
            const b = this.world.boss;
            if (Math.hypot(cx - (b.x + b.w / 2), cy - (b.y + b.h / 2)) < radius + 40) {
                const dmg = Math.floor(18 + cr * 28);
                b.hp = Math.max(0, b.hp - dmg);
                this.say(b.x, b.y + 80, "-" + dmg, "#f43f5e");
                if (b.hp <= 0) this.complete();
            }
        }
        p.charge = 0;
    }

    hurt() {
        const p = this.player;
        if (p.iFrames > 0) return;
        p.hp -= 1; p.iFrames = 60; this.sound.hitSound(); this.boom(8);
        p.charging = false; this.sound.stopChargeSound();
        this.say(p.x, p.y - 14, "-1 HP", "#f43f5e");
        if (p.hp <= 0) {
            this.state = "MODAL";
            this.modal = { title: "GAME OVER", story: "Sleepyhead dozed off. Press SNEEZE.", next: () => this.initLevel(this.levelIndex) };
        }
    }

    complete() {
        this.player.score += 500;
        if (this.levelIndex + 1 < this.levels.length) {
            this.state = "MODAL";
            this.modal = {
                title: "STAGE CLEAR",
                story: this.levels[this.levelIndex].story,
                next: () => this.initLevel(this.levelIndex + 1)
            };
        } else {
            this.state = "WIN";
        }
    }

    handleInput() {
        const k = this.input;
        if (k.pressSneeze) {
            this.sound.init();
            if (this.state === "START") this.initLevel(0);
            else if (this.state === "MODAL" && this.modal.next) this.modal.next();
            else if (this.state === "WIN") this.initLevel(0);
            else if (this.state === "PLAY") {
                const p = this.player;
                if (p.cooldown <= 0 && p.energy >= 25) { p.charging = true; p.charge = 0; this.sound.startChargeSound(); }
                else if (p.energy < 25) this.say(p.x, p.y - 14, "NO ENERGY!", "#ef4444");
            }
        }
        if (k.releaseSneeze && this.state === "PLAY") this.releaseSneeze();
        if (k.pressDash && this.state === "PLAY") this.startDash();
        if (k.keys.Down && this.state === "PLAY") {
            const p = this.player;
            if (p.grounded) { p.drop = 8; p.grounded = false; p.y += 2; }
            else if (!p.slamming && !p.dashing) { p.slamming = true; p.vy = 13; }
        }
    }

    update() {
        this.time++;
        if (this.shake.n > 0) {
            this.shake.x = (Math.random() - 0.5) * this.shake.n * 1.5;
            this.shake.y = (Math.random() - 0.5) * this.shake.n * 1.5;
            this.shake.n *= 0.88;
            if (this.shake.n < 0.2) { this.shake.n = 0; this.shake.x = 0; this.shake.y = 0; }
        }
        this.handleInput();
        if (this.state !== "PLAY") { this.input.endFrame(); return; }

        if (this.impact.on) {
            this.impact.t--;
            this.impact.fx += this.impact.fvx;
            this.impact.fy += this.impact.fvy;
            this.impact.fvy += 0.35;
            if (this.impact.t <= 0) this.impact.on = false;
            this.input.endFrame();
            return;
        }

        const p = this.player;
        const k = this.input.keys;
        if (p.iFrames > 0) p.iFrames--;
        if (p.cooldown > 0) p.cooldown--;
        if (p.dashCd > 0) p.dashCd--;
        if (p.charging) p.charge = Math.min(60, p.charge + 1);
        if (p.energy < 100 && !p.charging) p.energy = Math.min(100, p.energy + 0.35);
        p.scaleX += (1 - p.scaleX) * 0.15;
        p.scaleY += (1 - p.scaleY) * 0.15;

        let accel = 0;
        if (!p.dashing) {
            if (k.Left) { accel = -p.speed; p.facing = -1; }
            else if (k.Right) { accel = p.speed; p.facing = 1; }
        }
        if (p.dashing) {
            p.vx = p.dashX * 11; p.vy = p.dashY * 11; p.dashT--;
            if (p.dashT <= 0) { p.dashing = false; p.vx *= 0.4; p.vy *= 0.35; }
        } else {
            p.vx += (accel * (p.charging ? 0.5 : 1) - p.vx) * 0.22;
        }
        p.x += p.vx;
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > W) p.x = W - p.w;

        if (p.grounded) { p.coyote = 6; p.gliding = false; p.slamming = false; }
        else if (p.coyote > 0) p.coyote--;

        if (k.Up && !p.dashing) {
            if (p.coyote > 0) { p.vy = -7.8; p.grounded = false; p.coyote = 0; this.sound.jumpSound(); }
            else if (p.vy > 0) { p.gliding = true; p.vy = Math.min(p.vy, 1.2); }
        } else p.gliding = false;

        if (!p.grounded && !p.dashing) p.vy += p.gravity;
        const prevY = p.y;
        p.y += p.vy;
        if (p.y > H + 50) { this.hurt(); p.x = 50; p.y = 200; p.vy = 0; }

        p.grounded = false;
        if (p.drop > 0) p.drop--;
        this.world.platforms.forEach((pl) => {
            if (p.drop > 0) return;
            if (p.x + p.w > pl.x && p.x < pl.x + pl.w) {
                if (prevY + p.h <= pl.y + 10 && p.y + p.h >= pl.y && p.vy >= 0) {
                    p.y = pl.y - p.h; p.vy = 0; p.grounded = true;
                }
            }
        });

        this.world.pillows.forEach((pillow) => {
            if (!pillow.collected && p.x + p.w > pillow.x && p.x < pillow.x + 22 && p.y + p.h > pillow.y && p.y < pillow.y + 22) {
                pillow.collected = true; p.pillows++; p.score += 250;
                this.sound.pillowSound(); this.say(pillow.x, pillow.y - 10, "+250", "#818cf8");
                if (p.pillows >= this.levels[this.levelIndex].pillowsTotal && this.world.goalPost) this.world.goalPost.unlocked = true;
            }
        });

        this.world.enemies.forEach((e) => {
            if (!e.alive) return;
            if (e.flash > 0) e.flash--;
            if (e.stunned > 0) e.stunned--;
            else {
                e.x += e.vx;
                if (e.x <= e.minX || e.x + e.w >= e.maxX) e.vx = -e.vx;
                if (e.fly && e.baseY != null) e.y = e.baseY + Math.sin(this.time * 0.08 + e.x * 0.05) * (e.type === "moth" ? 24 : 18);
            }
            const pad = p.dashing ? 6 : 0;
            if (p.x + p.w + pad > e.x && p.x - pad < e.x + e.w && p.y + p.h + pad > e.y && p.y - pad < e.y + e.h) {
                if (p.dashing) {
                    if (!p.dashHits.includes(e)) { p.dashHits.push(e); this.dashHit(e); }
                } else if (!e.fly && prevY + p.h <= e.y + 8 && p.vy > 0) {
                    e.hp -= 1; p.vy = -6; this.sound.stompSound();
                    if (e.hp <= 0) { e.alive = false; p.score += 150; this.say(e.x, e.y - 10, "+150", "#818cf8"); }
                    else { e.stunned = 40; this.say(e.x, e.y - 10, "STUN!", "#fbbf24"); }
                } else if (e.stunned <= 0) this.hurt();
            }
        });

        this.world.hazards.forEach((hz) => {
            if (p.x + p.w > hz.x && p.x < hz.x + hz.w && p.y + p.h > hz.y && p.y < hz.y + hz.h) {
                this.hurt();
                if (p.iFrames >= 55) p.vy = -6.5;
            }
        });

        const boss = this.world.boss;
        if (boss) {
            const ratio = boss.hp / boss.maxHp;
            const next = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
            if (next !== boss.phase) {
                boss.phase = next;
                this.boom(16); this.say(W / 2 - 40, 80, "PHASE " + next + "!", "#f43f5e");
                this.sound.executeSound();
                if (next === 2) {
                    this.world.enemies.push(makeEnemy(120, 80, 0.9, 40, 300, "bat", { baseY: 80 }));
                    this.world.enemies.push(makeEnemy(620, 80, -0.9, 500, 760, "moth", { baseY: 90 }));
                }
                if (next === 3) {
                    this.world.enemies.push(makeEnemy(80, 366, 0.6, 20, 280, "ogre"));
                    this.world.enemies.push(makeEnemy(680, 366, -0.6, 520, 780, "ogre"));
                }
            }
            const sm = boss.phase === 1 ? 1 : boss.phase === 2 ? 1.6 : 2.2;
            boss.x += boss.vx * sm;
            if (boss.x <= 160 || boss.x + boss.w >= 640) boss.vx = -boss.vx;
            if (boss.phase === 3) boss.y = 20 + Math.sin(this.time * 0.12) * 18;
            boss.attackTimer--;
            if (boss.attackTimer <= 0) {
                const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
                const dx = (p.x + p.w / 2) - bx, dy = (p.y + p.h / 2) - by;
                const dist = Math.max(1, Math.hypot(dx, dy));
                if (boss.phase === 1) {
                    this.world.bossProjectiles.push({ x: bx, y: by, vx: (dx / dist) * 3.2, vy: (dy / dist) * 3.2, r: 9 });
                    boss.attackTimer = 80;
                } else if (boss.phase === 2) {
                    for (let a = -1; a <= 1; a++) {
                        const ang = Math.atan2(dy, dx) + a * 0.35;
                        this.world.bossProjectiles.push({ x: bx, y: by, vx: Math.cos(ang) * 4.2, vy: Math.sin(ang) * 4.2, r: 8 });
                    }
                    this.world.bossProjectiles.push({ x: p.x + 10, y: -10, vx: 0, vy: 4.5, r: 7 });
                    boss.attackTimer = 55;
                } else {
                    for (let a = 0; a < 8; a++) {
                        const ang = (Math.PI * 2 * a) / 8;
                        this.world.bossProjectiles.push({ x: bx, y: by, vx: Math.cos(ang) * 3.6, vy: Math.sin(ang) * 3.6, r: 7 });
                    }
                    boss.attackTimer = 70;
                }
                this.sound.hitSound();
            }
        }
        this.world.bossProjectiles.forEach((bp) => {
            bp.x += bp.vx; bp.y += bp.vy;
            if (p.x + p.w > bp.x - bp.r && p.x < bp.x + bp.r && p.y + p.h > bp.y - bp.r && p.y < bp.y + bp.r) {
                this.hurt(); bp.dead = true;
            }
        });
        this.world.bossProjectiles = this.world.bossProjectiles.filter((bp) => !bp.dead && bp.x > -40 && bp.x < W + 40 && bp.y < H + 40);

        if (this.world.goalPost && this.world.goalPost.unlocked) {
            const g = this.world.goalPost;
            if (p.x + p.w > g.x && p.x < g.x + g.w && p.y + p.h > g.y && p.y < g.y + g.h) this.complete();
        }

        this.floaters.forEach((f) => { f.y -= 0.7; f.life--; });
        this.floaters = this.floaters.filter((f) => f.life > 0);
        this.input.endFrame();
    }

    drawSprite(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, flip) {
        if (!img) return;
        ctx.save();
        if (flip) { ctx.translate(dx + dw, dy); ctx.scale(-1, 1); dx = 0; dy = 0; }
        ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), dw, dh);
        ctx.restore();
    }

    render() {
        const ctx = this.r.beginWorld();
        const theme = (this.levels[this.levelIndex] && this.levels[this.levelIndex].theme) || DEFAULT_THEME;
        ctx.fillStyle = theme.sky[0];
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = theme.sky[1] || theme.sky[0];
        ctx.fillRect(0, H * 0.4, W, H * 0.6);
        ctx.fillStyle = theme.sky[2] || theme.sky[0];
        ctx.fillRect(0, H * 0.7, W, H * 0.3);

        ctx.fillStyle = theme.moon;
        ctx.fillRect(670, 50, 40, 40);
        ctx.fillStyle = theme.sky[0];
        ctx.fillRect(682, 46, 28, 28);

        ctx.fillStyle = "#fff";
        for (let i = 0; i < (theme.starDensity || 20); i++) {
            if (Math.abs(Math.sin(this.time * 0.04 + i)) > 0.4) {
                ctx.fillRect((i * 47) % W, (i * 23) % 300, 2, 2);
            }
        }

        if (this.state === "START") {
            ctx.fillStyle = "#a5b4fc";
            ctx.font = "bold 48px monospace";
            ctx.textAlign = "center";
            ctx.fillText("SLEEPY SNEEZES", W / 2, 160);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "16px monospace";
            ctx.fillText("WASD MOVE   SHIFT SNEEZE   F DASH", W / 2, 220);
            ctx.fillStyle = "#818cf8";
            if (Math.floor(this.time / 30) % 2 === 0) ctx.fillText("PRESS SNEEZE", W / 2, 300);
            this.r.composite(W / 2, H / 2, this.shake);
            return;
        }

        const tiles = this.sheets.tiles;
        (this.world.platforms || []).forEach((pl) => {
            if (pl.type === "ground") {
                for (let x = pl.x; x < pl.x + pl.w; x += 16) {
                    this.drawSprite(ctx, tiles, 0, 0, 16, 16, x, pl.y, 16, 16);
                    this.drawSprite(ctx, tiles, 16, 0, 16, 16, x, pl.y + 16, 16, 16);
                    this.drawSprite(ctx, tiles, 16, 0, 16, 16, x, pl.y + 32, 16, 16);
                }
            } else {
                for (let x = pl.x; x < pl.x + pl.w; x += 16) {
                    this.drawSprite(ctx, tiles, 32, 0, 16, 16, x, pl.y, 16, 16);
                }
            }
        });

        (this.world.hazards || []).forEach((hz) => {
            for (let x = hz.x; x < hz.x + hz.w; x += 16) this.drawSprite(ctx, tiles, 48, 0, 16, 16, x, hz.y - 2, 16, 16);
        });

        (this.world.pillows || []).forEach((pillow) => {
            if (!pillow.collected) {
                const bob = Math.round(Math.sin(this.time * 0.09) * 4);
                this.drawSprite(ctx, tiles, 64, 0, 16, 16, pillow.x, pillow.y + bob, 16, 16);
            }
        });

        (this.world.alarmClocks || []).forEach((c) => {
            const ox = !c.rung ? Math.round(Math.sin(this.time * 0.3) * 2) : 0;
            ctx.globalAlpha = c.rung ? 0.4 : 1;
            this.drawSprite(ctx, tiles, 80, 0, 16, 16, c.x - 8 + ox, c.y - 8, 20, 20);
            ctx.globalAlpha = 1;
        });

        if (this.world.goalPost) {
            const g = this.world.goalPost;
            ctx.globalAlpha = g.unlocked ? 1 : 0.35;
            this.drawSprite(ctx, tiles, 96, 0, 16, 16, g.x, g.y, g.w, g.h);
            ctx.globalAlpha = 1;
        }

        if (this.world.boss && this.sheets.boss) {
            const b = this.world.boss;
            ctx.drawImage(this.sheets.boss, Math.round(b.x), Math.round(b.y));
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(200, 12, 400, 16);
            ctx.fillStyle = b.phase === 3 ? "#22d3ee" : b.phase === 2 ? "#fb7185" : "#818cf8";
            ctx.fillRect(202, 14, Math.max(0, (b.hp / b.maxHp) * 396), 12);
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("KING  PHASE " + b.phase + "/3", 400, 24);
        }

        (this.world.enemies || []).forEach((e) => {
            if (!e.alive) return;
            if (e.flash % 2 === 1) ctx.globalAlpha = 0.4;
            const fi = ENEMY_FRAME[e.type] || 0;
            this.drawSprite(this.r.wctx, this.sheets.enemies, fi * 32, 0, 32, 32, e.x, e.y, e.w, e.h, e.vx < 0);
            if (e.maxHp > 1) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#0f172a";
                ctx.fillRect(e.x, e.y - 5, e.w, 3);
                ctx.fillStyle = e.hp === 1 ? "#f43f5e" : "#22c55e";
                ctx.fillRect(e.x, e.y - 5, e.w * (e.hp / e.maxHp), 3);
            }
            ctx.globalAlpha = 1;
        });

        (this.world.bossProjectiles || []).forEach((bp) => {
            ctx.fillStyle = "#c4b5fd";
            ctx.fillRect(bp.x - bp.r, bp.y - bp.r, bp.r * 2, bp.r * 2);
        });

        const p = this.player;
        if (p.iFrames % 4 < 2 && this.state === "PLAY") {
            let frame = 0;
            if (p.dashing) frame = 4;
            else if (p.charging) frame = 5;
            else if (!p.grounded) frame = 3;
            else if (Math.abs(p.vx) > 0.4) frame = 1 + (Math.floor(this.time / 8) % 2);
            this.drawSprite(ctx, this.sheets.player, frame * 40, 0, 40, 44, p.x - 4, p.y - 4, 40, 44, p.facing < 0);
        }

        this.floaters.forEach((f) => {
            ctx.fillStyle = f.color;
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText(f.text, f.x, f.y);
        });

        const lvl = this.levels[this.levelIndex];
        ctx.textAlign = "left";
        ctx.font = "14px monospace";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("CH " + (this.levelIndex + 1) + " " + lvl.title, 16, 24);
        ctx.fillStyle = "#f43f5e";
        ctx.fillText("HP " + p.hp, 16, 44);
        ctx.fillStyle = "#818cf8";
        ctx.fillText("PILLOWS " + p.pillows + "/" + lvl.pillowsTotal, 90, 44);
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("SCORE " + p.score, 250, 44);
        ctx.fillStyle = p.dashCd > 0 ? "#64748b" : "#a5b4fc";
        ctx.fillText(p.dashCd > 0 ? "DASH..." : "DASH F", 400, 44);

        if (this.impact.on) {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, W, H);
            ctx.save();
            ctx.translate(W / 2, H / 2);
            ctx.scale(2.4, 2.4);
            ctx.translate(-this.impact.px, -this.impact.py);
            ctx.fillStyle = "#020617";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillRect(this.impact.fx, this.impact.fy, 24, 22);
            ctx.restore();
            ctx.fillStyle = "#020617";
            ctx.font = "bold 84px monospace";
            ctx.textAlign = "center";
            ctx.fillText(this.impact.kanji, W / 2 + 160, H / 2 - 30);
        }

        if (this.state === "MODAL" || this.state === "WIN") {
            ctx.fillStyle = "rgba(2,2,12,0.75)";
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = "#a5b4fc";
            ctx.font = "bold 40px monospace";
            ctx.textAlign = "center";
            ctx.fillText(this.state === "WIN" ? "THE END" : this.modal.title, W / 2, 180);
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "16px monospace";
            ctx.fillText(this.state === "WIN" ? "Sleep restored. Score " + p.score : this.modal.story, W / 2, 230);
            if (Math.floor(this.time / 30) % 2 === 0) {
                ctx.fillStyle = "#818cf8";
                ctx.fillText("PRESS SNEEZE", W / 2, 300);
            }
        }

        const lx = p.x + p.w / 2;
        const ly = p.y + p.h / 2;
        this.r.composite(lx, ly, this.shake);
    }

    tick() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.tick());
    }
}
