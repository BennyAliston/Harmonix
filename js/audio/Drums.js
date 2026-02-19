import { audio } from './AudioEngine.js';

export class Drums {
    constructor() {
        this.output = audio.ctx.createGain();
        this.output.gain.value = 0.8;
    }

    connect(node) {
        this.output.connect(node);
    }

    play(type, time, velocity = 1.0) {
        switch (type.toLowerCase()) {
            case 'kick':
                this.playKick(time, velocity);
                break;
            case 'snare':
                this.playSnare(time, velocity);
                break;
            case 'hihat':
                this.playHiHat(time, velocity);
                break;
            case 'clap':
                this.playClap(time, velocity);
                break;
        }
    }

    playKick(time, velocity) {
        const ctx = audio.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(velocity, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(gain);
        gain.connect(this.output);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playSnare(time, velocity) {
        const ctx = audio.ctx;

        // Noise
        const bufferSize = ctx.sampleRate * 0.2; // 200ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.8, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.output);
        noise.start(time);

        // Tonal 'snap'
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5 * velocity, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.output);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playHiHat(time, velocity) {
        const ctx = audio.ctx;
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        noise.start(time);
    }

    playClap(time, velocity) {
        const ctx = audio.ctx;
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        // Simulate multiple claps with envelope
        const t = time;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(velocity, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.output);
        noise.start(time);
    }
}
