import { sequencer } from '../core/Sequencer.js';

export class GridUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();

        window.addEventListener('step', (e) => this.highlightStep(e.detail.step));
    }

    render() {
        this.container.innerHTML = '';

        // Create Headers (Left Column)
        const headerCol = document.createElement('div');
        headerCol.className = 'grid grid-rows-8 gap-1.5 mr-2 w-24 shrink-0';
        sequencer.tracks.forEach(track => {
            const h = document.createElement('div');
            h.innerText = track.name;
            h.className = 'flex items-center justify-end text-[10px] font-bold text-gray-500 font-mono h-[30px] pr-2 tracking-wider';
            headerCol.appendChild(h);
        });

        // Create Grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-16 grid-rows-8 gap-y-1.5 gap-x-1';

        sequencer.tracks.forEach((track, r) => {
            for (let s = 0; s < 16; s++) {
                const btn = document.createElement('button');
                btn.id = `cell-${r}-${s}`;
                btn.className = `w-full h-[30px] rounded transition-all duration-100 ${s % 4 === 0 ? 'bg-zinc-800' : 'bg-zinc-900'
                    } hover:bg-zinc-700 border border-transparent`;

                if (track.data[s]) {
                    btn.classList.add('bg-cyan-500', 'shadow-[0_0_10px_rgba(6,182,212,0.5)]');
                }

                btn.onclick = () => {
                    sequencer.toggleStep(r, s);
                    this.updateCell(r, s, btn);
                };
                gridContainer.appendChild(btn);
            }
        });

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'flex';
        wrapper.appendChild(headerCol);
        wrapper.appendChild(gridContainer);

        this.container.appendChild(wrapper);
    }

    updateCell(r, s, btn) {
        const isActive = sequencer.tracks[r].data[s];
        if (isActive) {
            btn.classList.remove('bg-zinc-800', 'bg-zinc-900');
            btn.classList.add('bg-cyan-600', 'shadow-sm', 'shadow-cyan-500/20');
        } else {
            btn.classList.remove('bg-cyan-600', 'shadow-sm', 'shadow-cyan-500/20');
            btn.classList.add(s % 4 === 0 ? 'bg-zinc-800' : 'bg-zinc-900');
        }
    }

    highlightStep(step) {
        // Visual feedback for current step playback
        // This is tricky with DOM only - usually just toggling a class on the column
        // For performance, we might want to use a canvas overlay or efficient class toggling
        // For now, let's just log or maybe add a border
        // Implementation detail: remove 'current-step' from all cells, add to current column
        const allCells = this.container.querySelectorAll('button');
        allCells.forEach(c => c.classList.remove('border-white/50'));

        for (let r = 0; r < sequencer.tracks.length; r++) {
            const cell = document.getElementById(`cell-${r}-${step}`);
            if (cell) cell.classList.add('border-white/50');
        }
    }
}
