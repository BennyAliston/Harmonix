import { GridUI } from './ui/Grid.js';
import { ControlsUI } from './ui/Controls.js';
import { audio } from './audio/AudioEngine.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Harmonix DAW Initializing...");

    // Initialize UI
    const grid = new GridUI('sequencer-grid');
    const controls = new ControlsUI();

    try {
        console.log("Initializing Audio...");
        await audio.init();
        console.log("Audio Initialized. Starting Visualizer...");
        startVisualizer();
    } catch (e) {
        console.error("Audio Init Failed:", e);
    }
});

function startVisualizer() {
    const canvas = document.getElementById('viz-canvas');
    if (!canvas) return;

    if (!audio.ctx) return; // Safety check

    const ctx = canvas.getContext('2d');
    const analyser = audio.ctx.createAnalyser();
    analyser.fftSize = 256;
    audio.masterGain.connect(analyser); // Tap into master output

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#000'; // Fully overwrite with black to avoid trails
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;

            ctx.fillStyle = `hsl(${i / bufferLength * 260 + 160}, 70%, 50%)`; // Cyan to Purple gradient
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
    draw();
}
