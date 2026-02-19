import { audio } from './AudioEngine.js';

export class Synth {
    constructor() {
        this.output = audio.ctx.createGain();
        this.output.gain.value = 0.5; // Default volume per track

        // Default settings
        this.settings = {
            waveform: 'sawtooth',
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.3,
            filterCutoff: 2000,
            filterRes: 0,
            detune: 0
        };
    }

    connect(node) {
        this.output.connect(node);
    }

    playNote(freq, time, duration = 0.2, velocity = 1.0) {
        const ctx = audio.ctx;
        const osc = ctx.createOscillator();
        const flt = ctx.createBiquadFilter();
        const env = ctx.createGain();

        // Oscillator
        osc.type = this.settings.waveform;
        osc.frequency.value = freq;
        osc.detune.value = this.settings.detune;

        // Filter
        flt.type = 'lowpass';
        flt.frequency.value = this.settings.filterCutoff;
        flt.Q.value = this.settings.filterRes;

        // Envelope (ADSR)
        const t = time;
        const a = this.settings.attack;
        const d = this.settings.decay;
        const s = this.settings.sustain;
        const r = this.settings.release;

        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(velocity, t + a);
        env.gain.exponentialRampToValueAtTime(s * velocity, t + a + d);
        env.gain.linearRampToValueAtTime(0, t + a + d + duration + r);

        // Connect graph
        osc.connect(flt);
        flt.connect(env);
        env.connect(this.output);

        // Start/Stop
        osc.start(t);
        osc.stop(t + a + d + duration + r + 0.1); // Small buffer for release safety
    }

    setParam(param, value) {
        if (this.settings.hasOwnProperty(param)) {
            this.settings[param] = value;
        }
    }
}
