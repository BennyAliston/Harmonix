import { audio } from '../audio/AudioEngine.js';
import { Synth } from '../audio/Synth.js';
import { Drums } from '../audio/Drums.js';

export class Sequencer {
    constructor() {
        this.tempo = 120;
        this.isPlaying = false;
        this.currentStep = 0;
        this.nextNoteTime = 0.0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25.0; // ms
        this.timerID = null;

        // Tracks
        this.tracks = [
            { name: "Lead 1", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Lead 2", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Pad 1", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Pad 2", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Bass 1", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Bass 2", type: "synth", inst: new Synth(), data: Array(16).fill(false) },
            { name: "Snare", type: "drums", inst: new Drums(), data: Array(16).fill(false) },
            { name: "Kick", type: "drums", inst: new Drums(), data: Array(16).fill(false) }
        ];

        // Connect all tracks to master
        this.tracks.forEach(t => t.inst.connect(audio.masterGain));

        // Note frequencies for rows (C Minor Scale simplified)
        this.notes = [523.25, 466.16, 392.00, 349.23, 311.13, 261.63];
    }

    start() {
        if (this.isPlaying) return;
        if (audio.ctx.state === 'suspended') audio.ctx.resume();
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = audio.time;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    scheduler() {
        while (this.nextNoteTime < audio.time + this.scheduleAheadTime) {
            this.scheduleNote(this.currentStep, this.nextNoteTime);
            this.nextStep();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextStep() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.currentStep = (this.currentStep + 1) % 16;
    }

    scheduleNote(stepNumber, time) {
        // Update UI grid brightness/highlight
        window.dispatchEvent(new CustomEvent('step', { detail: { step: stepNumber } }));

        this.tracks.forEach((track, index) => {
            if (track.data[stepNumber]) {
                if (track.type === 'synth') {
                    // Play synth note
                    const freq = this.notes[index] || 220; // Default fallback
                    track.inst.playNote(freq, time, 0.2);
                } else if (track.type === 'drums') {
                    // Play drum sample
                    track.inst.play(track.name, time);
                }
            }
        });
    }

    toggleStep(trackIndex, stepIndex) {
        this.tracks[trackIndex].data[stepIndex] = !this.tracks[trackIndex].data[stepIndex];
    }

    setTempo(bpm) {
        this.tempo = bpm;
    }
}

export const sequencer = new Sequencer();
