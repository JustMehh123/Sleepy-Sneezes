export function enemyStats(type) {
    if (type === "ogre") return { hp: 3, maxHp: 3, strength: 3, w: 32, h: 32 };
    if (type === "bat") return { hp: 2, maxHp: 2, strength: 2, w: 32, h: 24, fly: true };
    if (type === "moth") return { hp: 2, maxHp: 2, strength: 2, w: 32, h: 26, fly: true };
    if (type === "slime") return { hp: 2, maxHp: 2, strength: 1, w: 28, h: 20 };
    if (type === "clockling") return { hp: 2, maxHp: 2, strength: 2, w: 28, h: 28 };
    if (type === "scarecrow") return { hp: 3, maxHp: 3, strength: 3, w: 30, h: 32 };
    if (type === "fox") return { hp: 1, maxHp: 1, strength: 1, w: 32, h: 22 };
    return { hp: 1, maxHp: 1, strength: 1, w: 26, h: 24 };
}

export function makeEnemy(x, y, vx, minX, maxX, type, extra) {
    const s = enemyStats(type);
    return Object.assign({
        x, y, vx, minX, maxX, type,
        w: s.w, h: s.h, hp: s.hp, maxHp: s.maxHp, strength: s.strength,
        fly: !!s.fly, alive: true, stunned: 0, flash: 0
    }, extra || {});
}

export const DEFAULT_THEME = {
    sky: ["#010208", "#050614", "#0a0c1c", "#0e1020"],
    moon: "#c4b5fd",
    starDensity: 28
};

export function buildLevels() {
    return [
        {
            title: "Allergy Curse",
            story: "Grab pillows. Dash (F) any way but straight down. Sneeze (Shift) to blast.",
            pillowsTotal: 4,
            theme: DEFAULT_THEME,
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 90, y: 310, w: 160, h: 18, type: "static" },
                    { x: 300, y: 250, w: 150, h: 18, type: "static" },
                    { x: 500, y: 190, w: 150, h: 18, type: "static" },
                    { x: 200, y: 140, w: 140, h: 18, type: "static" },
                    { x: 660, y: 300, w: 110, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 150, y: 270, collected: false },
                    { x: 350, y: 210, collected: false },
                    { x: 560, y: 150, collected: false },
                    { x: 250, y: 100, collected: false }
                ];
                world.enemies = [
                    makeEnemy(220, 376, 0.7, 40, 420, "bunny"),
                    makeEnemy(540, 166, -0.55, 500, 640, "slime"),
                    makeEnemy(700, 276, 0.55, 660, 770, "fox"),
                    makeEnemy(430, 100, 0.7, 380, 520, "moth", { baseY: 100 })
                ];
                world.hazards = [{ x: 480, y: 385, w: 70, h: 15, type: "spikes" }];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 720, y: 350, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Midnight Winds",
            story: "Charge sneezes for big recoil. Stun ogres, then FINISH them.",
            pillowsTotal: 4,
            theme: { sky: ["#02030a", "#070814", "#0c1020", "#121018"], moon: "#a5b4fc", starDensity: 40 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 180, y: 320, w: 140, h: 18, type: "static" },
                    { x: 400, y: 260, w: 140, h: 18, type: "static" },
                    { x: 220, y: 180, w: 150, h: 18, type: "static" },
                    { x: 40, y: 130, w: 130, h: 18, type: "static" },
                    { x: 610, y: 160, w: 150, h: 18, type: "static" },
                    { x: 620, y: 320, w: 140, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 230, y: 280, collected: false },
                    { x: 450, y: 220, collected: false },
                    { x: 90, y: 90, collected: false },
                    { x: 670, y: 120, collected: false }
                ];
                world.enemies = [
                    makeEnemy(240, 156, 0.65, 220, 350, "fox"),
                    makeEnemy(650, 136, -0.55, 610, 750, "slime"),
                    makeEnemy(200, 366, 0.55, 40, 500, "ogre"),
                    makeEnemy(300, 100, -0.8, 220, 400, "bat", { baseY: 100 })
                ];
                world.hazards = [
                    { x: 520, y: 385, w: 80, h: 15, type: "spikes" },
                    { x: 650, y: 145, w: 50, h: 15, type: "spikes" }
                ];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 690, y: 330, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Pillow Fort Peaks",
            story: "Scarecrows tank dashes. Stomp or blast the rest.",
            pillowsTotal: 4,
            theme: { sky: ["#05040a", "#0c0814", "#140c18", "#1a1018"], moon: "#c4b5fd", starDensity: 32 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 160, y: 330, w: 140, h: 18, type: "static" },
                    { x: 360, y: 270, w: 150, h: 18, type: "static" },
                    { x: 540, y: 210, w: 140, h: 18, type: "static" },
                    { x: 360, y: 140, w: 140, h: 18, type: "static" },
                    { x: 160, y: 100, w: 140, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 200, y: 290, collected: false },
                    { x: 590, y: 170, collected: false },
                    { x: 400, y: 100, collected: false },
                    { x: 200, y: 60, collected: false }
                ];
                world.enemies = [
                    makeEnemy(80, 368, 0.5, 20, 280, "scarecrow"),
                    makeEnemy(230, 306, -0.65, 160, 290, "slime"),
                    makeEnemy(400, 104, 0.45, 360, 490, "ogre"),
                    makeEnemy(700, 378, -0.9, 520, 780, "fox"),
                    makeEnemy(220, 60, 0.9, 160, 300, "moth", { baseY: 60 }),
                    makeEnemy(590, 150, -0.85, 540, 680, "bat", { baseY: 150 })
                ];
                world.hazards = [
                    { x: 300, y: 385, w: 70, h: 15, type: "spikes" },
                    { x: 380, y: 125, w: 50, h: 15, type: "spikes" }
                ];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 730, y: 350, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Dreamy Nebula",
            story: "Moths and bats own the air. Dash diagonally.",
            pillowsTotal: 4,
            theme: { sky: ["#02040c", "#070a1f", "#0e1636", "#1a1042"], moon: "#c4b5fd", starDensity: 50 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 180, y: 320, w: 140, h: 18, type: "static" },
                    { x: 360, y: 250, w: 150, h: 18, type: "static" },
                    { x: 540, y: 190, w: 150, h: 18, type: "static" },
                    { x: 330, y: 130, w: 150, h: 18, type: "static" },
                    { x: 80, y: 110, w: 140, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 220, y: 280, collected: false },
                    { x: 410, y: 210, collected: false },
                    { x: 380, y: 90, collected: false },
                    { x: 130, y: 70, collected: false }
                ];
                world.enemies = [
                    makeEnemy(80, 376, 0.7, 20, 360, "slime"),
                    makeEnemy(380, 104, 0.55, 330, 470, "ogre"),
                    makeEnemy(150, 86, -0.9, 80, 210, "fox"),
                    makeEnemy(700, 340, -0.85, 500, 780, "moth", { baseY: 340 }),
                    makeEnemy(250, 40, 0.8, 80, 340, "bat", { baseY: 40 })
                ];
                world.hazards = [
                    { x: 420, y: 385, w: 80, h: 15, type: "spikes" },
                    { x: 350, y: 115, w: 60, h: 15, type: "spikes" }
                ];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 710, y: 350, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Clockwork Nightmare",
            story: "Ring clocks with sneezes. Clocklings patrol the brass.",
            pillowsTotal: 4,
            theme: { sky: ["#06040f", "#100a26", "#1c1030", "#2a0f2c"], moon: "#fde68a", starDensity: 36 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 200, y: 320, w: 150, h: 18, type: "static" },
                    { x: 400, y: 260, w: 150, h: 18, type: "static" },
                    { x: 580, y: 190, w: 150, h: 18, type: "static" },
                    { x: 360, y: 140, w: 150, h: 18, type: "static" },
                    { x: 120, y: 120, w: 150, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 250, y: 280, collected: false },
                    { x: 450, y: 220, collected: false },
                    { x: 410, y: 100, collected: false },
                    { x: 170, y: 80, collected: false }
                ];
                world.alarmClocks = [
                    { x: 260, y: 305, rung: false },
                    { x: 460, y: 245, rung: false },
                    { x: 420, y: 125, rung: false }
                ];
                world.enemies = [
                    makeEnemy(80, 372, 0.7, 20, 360, "clockling"),
                    makeEnemy(430, 232, -0.75, 400, 540, "clockling"),
                    makeEnemy(170, 92, 0.65, 120, 260, "slime"),
                    makeEnemy(630, 150, -0.9, 580, 730, "moth", { baseY: 150 }),
                    makeEnemy(260, 60, 0.85, 120, 360, "bat", { baseY: 60 })
                ];
                world.hazards = [
                    { x: 480, y: 385, w: 70, h: 15, type: "spikes" },
                    { x: 140, y: 105, w: 45, h: 15, type: "spikes" }
                ];
                world.boss = null;
                world.goalPost = { x: 640, y: 150, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Pollen Marsh",
            story: "Slime puddles. Diagonal dashes.",
            pillowsTotal: 4,
            theme: { sky: ["#020806", "#06140c", "#0a1c12", "#0c1810"], moon: "#86efac", starDensity: 22 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 70, y: 320, w: 160, h: 18, type: "static" },
                    { x: 300, y: 260, w: 180, h: 18, type: "static" },
                    { x: 540, y: 200, w: 160, h: 18, type: "static" },
                    { x: 240, y: 140, w: 140, h: 18, type: "static" },
                    { x: 640, y: 320, w: 120, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 120, y: 280, collected: false },
                    { x: 360, y: 220, collected: false },
                    { x: 590, y: 160, collected: false },
                    { x: 280, y: 100, collected: false }
                ];
                world.enemies = [
                    makeEnemy(100, 380, 0.5, 20, 280, "slime"),
                    makeEnemy(360, 240, -0.6, 300, 470, "slime"),
                    makeEnemy(560, 168, 0.45, 540, 690, "scarecrow"),
                    makeEnemy(680, 298, 0.7, 640, 760, "fox"),
                    makeEnemy(280, 90, 0.8, 240, 380, "moth", { baseY: 90 })
                ];
                world.hazards = [{ x: 400, y: 385, w: 90, h: 15, type: "spikes" }];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 720, y: 350, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Moonlit Orchard",
            story: "Foxes zip. Stun scarecrows, then FINISH.",
            pillowsTotal: 4,
            theme: { sky: ["#0a0408", "#140810", "#1c0c14", "#140810"], moon: "#fda4af", starDensity: 40 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 40, y: 300, w: 140, h: 18, type: "static" },
                    { x: 250, y: 240, w: 150, h: 18, type: "static" },
                    { x: 460, y: 180, w: 150, h: 18, type: "static" },
                    { x: 620, y: 280, w: 140, h: 18, type: "static" },
                    { x: 160, y: 120, w: 160, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 80, y: 260, collected: false },
                    { x: 300, y: 200, collected: false },
                    { x: 500, y: 140, collected: false },
                    { x: 200, y: 80, collected: false }
                ];
                world.enemies = [
                    makeEnemy(80, 368, 0.4, 20, 240, "scarecrow"),
                    makeEnemy(280, 218, 1.1, 250, 390, "fox"),
                    makeEnemy(500, 158, -1.0, 460, 600, "fox"),
                    makeEnemy(650, 246, 0.5, 620, 760, "ogre"),
                    makeEnemy(200, 70, 0.7, 160, 320, "moth", { baseY: 70 })
                ];
                world.hazards = [{ x: 320, y: 385, w: 80, h: 15, type: "spikes" }];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 700, y: 230, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Gear Cathedral",
            story: "Clocklings in the nave.",
            pillowsTotal: 4,
            theme: { sky: ["#0c0a06", "#18140c", "#24180c", "#1a1408"], moon: "#fde68a", starDensity: 20 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 100, y: 310, w: 140, h: 18, type: "static" },
                    { x: 320, y: 250, w: 160, h: 18, type: "static" },
                    { x: 540, y: 190, w: 150, h: 18, type: "static" },
                    { x: 200, y: 150, w: 140, h: 18, type: "static" },
                    { x: 660, y: 310, w: 120, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 140, y: 270, collected: false },
                    { x: 380, y: 210, collected: false },
                    { x: 590, y: 150, collected: false },
                    { x: 240, y: 110, collected: false }
                ];
                world.enemies = [
                    makeEnemy(120, 372, 0.7, 20, 300, "clockling"),
                    makeEnemy(350, 222, -0.65, 320, 470, "clockling"),
                    makeEnemy(560, 162, 0.55, 540, 680, "clockling"),
                    makeEnemy(680, 276, 0.5, 660, 780, "ogre"),
                    makeEnemy(240, 90, 0.85, 200, 340, "bat", { baseY: 90 })
                ];
                world.hazards = [{ x: 430, y: 385, w: 70, h: 15, type: "spikes" }];
                world.alarmClocks = [];
                world.boss = null;
                world.goalPost = { x: 700, y: 260, w: 40, h: 50, unlocked: false };
            }
        },
        {
            title: "Nightmare King's Lair",
            story: "Three phases. Sneeze the king. Dash the adds.",
            pillowsTotal: 4,
            theme: { sky: ["#08030d", "#160820", "#241030", "#320f2a"], moon: "#fda4af", starDensity: 40 },
            setup(world) {
                world.platforms = [
                    { x: 0, y: 400, w: 800, h: 50, type: "ground" },
                    { x: 80, y: 300, w: 150, h: 18, type: "static" },
                    { x: 570, y: 300, w: 150, h: 18, type: "static" },
                    { x: 300, y: 230, w: 200, h: 18, type: "static" },
                    { x: 140, y: 140, w: 150, h: 18, type: "static" },
                    { x: 510, y: 140, w: 150, h: 18, type: "static" }
                ];
                world.pillows = [
                    { x: 130, y: 260, collected: false },
                    { x: 640, y: 260, collected: false },
                    { x: 200, y: 100, collected: false },
                    { x: 570, y: 100, collected: false }
                ];
                world.alarmClocks = [
                    { x: 145, y: 285, rung: false },
                    { x: 655, y: 285, rung: false },
                    { x: 215, y: 125, rung: false },
                    { x: 585, y: 125, rung: false }
                ];
                world.enemies = [];
                world.hazards = [];
                world.bossProjectiles = [];
                world.boss = { x: 350, y: 30, w: 110, h: 80, vx: 1.2, hp: 240, maxHp: 240, attackTimer: 80, phase: 1 };
                world.goalPost = null;
            }
        }
    ];
}
