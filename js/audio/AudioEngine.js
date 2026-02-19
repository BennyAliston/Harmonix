export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.limiter = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Master Limiter
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -2;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.005;
        this.limiter.release.value = 0.050;

        // Routing
        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        this.initialized = true;
        console.log("Audio Engine Initialized");
    }

    get time() {
        return this.ctx ? this.ctx.currentTime : 0;
    }
}

export const audio = new AudioEngine();
