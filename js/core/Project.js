import { sequencer } from './Sequencer.js';

export class ProjectManager {
    save() {
        const data = {
            tempo: sequencer.tempo,
            tracks: sequencer.tracks.map(t => ({
                name: t.name,
                data: t.data
            }))
        };
        localStorage.setItem('harmonix_project', JSON.stringify(data));
        console.log("Project Saved");
    }

    load() {
        const json = localStorage.getItem('harmonix_project');
        if (!json) return;
        const data = JSON.parse(json);

        sequencer.tempo = data.tempo;
        if (data.tracks) {
            data.tracks.forEach((t, i) => {
                if (sequencer.tracks[i]) {
                    sequencer.tracks[i].data = t.data;
                }
            });
        }
        console.log("Project Loaded");
    }
}

export const project = new ProjectManager();
