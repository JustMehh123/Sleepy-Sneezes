export class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.chargeOsc = null;
    }
    init() {
        if (!this.ctx) {
            const A = window.AudioContext || window.webkitAudioContext;
            if (A) this.ctx = new A();
        }
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    playTone(freq, type, duration, startGain = 0.2, endGain = 0.01) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(startGain, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endGain, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }
    jumpSound() { this.playTone(350, "sine", 0.15, 0.25, 0.01); }
    hitSound() { this.playTone(120, "sawtooth", 0.25, 0.3, 0.01); }
    stompSound() { this.playTone(220, "square", 0.12, 0.2, 0.01); }
    pillowSound() {
        this.playTone(523, "sine", 0.1, 0.2, 0.01);
        setTimeout(() => this.playTone(659, "sine", 0.15, 0.2, 0.01), 80);
    }
    dashSound() {
        this.playTone(180, "square", 0.08, 0.18, 0.01);
        setTimeout(() => this.playTone(420, "sawtooth", 0.12, 0.22, 0.01), 40);
    }
    executeSound() {
        this.playTone(80, "sawtooth", 0.4, 0.4, 0.01);
        setTimeout(() => this.playTone(880, "triangle", 0.35, 0.28, 0.01), 160);
    }
    startChargeSound() {
        if (this.muted || !this.ctx || this.chargeOsc) return;
        try {
            this.chargeOsc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            this.chargeOsc.type = "triangle";
            this.chargeOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
            this.chargeOsc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 1.2);
            g.gain.setValueAtTime(0.05, this.ctx.currentTime);
            this.chargeOsc.connect(g);
            g.connect(this.ctx.destination);
            this.chargeOsc.start();
            this.chargeGain = g;
        } catch (e) {}
    }
    stopChargeSound() {
        if (this.chargeOsc) {
            try { this.chargeOsc.stop(); this.chargeOsc.disconnect(); } catch (e) {}
            this.chargeOsc = null;
        }
    }
    sneezeSound(power = 1) {
        if (this.muted || !this.ctx) return;
        this.playTone(400 * power, "square", 0.25, 0.3, 0.01);
    }
}
