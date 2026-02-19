import { sequencer } from '../core/Sequencer.js';
import { audio } from '../audio/AudioEngine.js';
import { project } from '../core/Project.js';

export class ControlsUI {
    constructor() {
        this.btnPlay = document.getElementById('btn-play');
        this.btnRecord = document.getElementById('btn-record');
        this.btnClear = document.getElementById('btn-clear');
        this.sliderTempo = document.getElementById('tempo-slider');
        this.dispBpm = document.getElementById('bpm-display');

        this.init();
    }

    init() {
        if (!this.btnPlay || !this.sliderTempo) return;

        this.btnPlay.onclick = async () => {
            if (audio.ctx.state === 'suspended') await audio.init();

            if (sequencer.isPlaying) {
                sequencer.stop();
                this.btnPlay.innerText = "PLAY";
                this.btnPlay.classList.remove('bg-red-600', 'text-white', 'animate-pulse');
                this.btnPlay.classList.add('bg-[#2a2a2e]', 'text-white');
            } else {
                sequencer.start();
                this.btnPlay.innerText = "STOP";
                this.btnPlay.classList.remove('bg-[#2a2a2e]');
                this.btnPlay.classList.add('bg-red-600', 'text-white', 'animate-pulse');
            }
        };

        this.sliderTempo.oninput = (e) => {
            const bpm = parseInt(e.target.value);
            sequencer.setTempo(bpm);
            if (this.dispBpm) this.dispBpm.innerText = `${bpm} BPM`;
        };

        if (this.btnRecord) {
            this.btnRecord.onclick = () => {
                project.save();
                // Simple feedback since alert might block
                const originalText = this.btnRecord.innerText;
                this.btnRecord.innerText = "SAVED!";
                setTimeout(() => this.btnRecord.innerText = originalText, 1000);
            };
        }

        if (this.btnClear) {
            this.btnClear.onclick = () => {
                const confirmClear = confirm("Clear pattern?");
                if (confirmClear) {
                    sequencer.tracks.forEach(t => t.data.fill(false));
                    window.location.reload();
                }
            };
        }
    }
}
