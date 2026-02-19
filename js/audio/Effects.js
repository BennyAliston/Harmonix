import { audio } from './AudioEngine.js';

export class EffectsChain {
    constructor() {
        this.input = audio.ctx.createGain();
        this.output = audio.ctx.createGain();

        const ctx = audio.ctx;

        // --- Reverb (Convolver) ---
        this.reverbScale = ctx.createGain();
        this.reverbScale.gain.value = 0; // Wet amount
        this.convolver = ctx.createConvolver();
        this.createReverbImpulse(); // Generate simple impulse

        // Dry/Wet Reverb
        this.reverbDry = ctx.createGain();
        this.reverbDry.gain.value = 1;

        // --- Delay ---
        this.delayNode = ctx.createDelay();
        this.delayNode.delayTime.value = 0.3; // 300ms
        this.delayFeedback = ctx.createGain();
        this.delayFeedback.gain.value = 0.4;
        this.delayWet = ctx.createGain();
        this.delayWet.gain.value = 0; // Off by default

        // Delay Wiring
        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);

        // --- Routing Chain ---
        // Input -> [Dry Path] -> Output
        // Input -> Reverb -> Output
        // Input -> Delay -> Output

        this.input.connect(this.reverbDry);
        this.reverbDry.connect(this.output);

        // Reverb Send
        this.input.connect(this.reverbScale);
        this.reverbScale.connect(this.convolver);
        this.convolver.connect(this.output);

        // Delay Send
        this.input.connect(this.delayNode);
        this.delayNode.connect(this.delayWet);
        this.delayWet.connect(this.output);
    }

    createReverbImpulse() {
        // Simple noise burst for reverb tail
        const ctx = audio.ctx;
        const length = ctx.sampleRate * 2.0; // 2 seconds
        const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        const L = buffer.getChannelData(0);
        const R = buffer.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, 2);
            L[i] = (Math.random() * 2 - 1) * decay;
            R[i] = (Math.random() * 2 - 1) * decay;
        }
        this.convolver.buffer = buffer;
    }

    setReverb(amount) {
        this.reverbScale.gain.value = amount;
    }

    setDelay(amount) {
        this.delayWet.gain.value = amount;
    }

    setDelayTime(time) {
        this.delayNode.delayTime.value = time;
    }

    connect(node) {
        this.output.connect(node);
    }
}
