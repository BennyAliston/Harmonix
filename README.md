# HARMONIX 🎛️

> *Retro Music Studio compose beats, twist knobs, export tracks.*

Harmonix is a browser-based music production studio with a skeuomorphic rack-mount interface. It features a step sequencer, channel mixer, piano keyboard, and master effects all synthesized in real-time with the Web Audio API.

## ✨ Features

- **Step Sequencer**: 16-step grid with 8 synthesized instruments (Kick, Snare, Hi-Hat, Clap, Tom, Bass, Synth, Perc). Built-in presets for Hip-Hop, House, Techno, Jazz, DnB, Trap & Reggaeton.
- **Channel Mixer**: Per-channel volume faders and mute controls with real-time drag interaction.
- **Piano Keyboard**: 3-octave playable keyboard with scale/key filtering (Major, Minor, Pentatonic, Blues, Dorian, and more).
- **Master Effects**: SVG rotary knobs for Reverb, Delay, and Filter with real-time audio processing.
- **Oscilloscope**: CRT-style waveform display powered by the PowerAudio visualizer engine.
- **WAV Export**: Record and export your pattern as a WAV file directly from the browser.
- **State Persistence**: Your patterns, volumes, effects, and settings are saved to localStorage automatically.
- **Keyboard Shortcuts**: Space bar for play/stop.
- **Responsive Design**: Fully functional on mobile and desktop.

## 🎛️ Controls

- **SEQUENCER** tab: Click cells to toggle instrument steps. Use presets, clear, or randomize.
- **MIXER** tab: Drag faders to adjust volume per instrument. Click **M** to mute.
- **KEYS** tab: Play notes with mouse/touch. Select key and scale to highlight notes.
- **EFFECTS** tab: Drag knobs to control Reverb, Delay, and Filter. Click **Record & Export WAV** to capture your loop.
- **Transport bar**: Play, Stop, Loop toggle, BPM slider (60–180), Swing slider (0–100%).

## 🛠️ Technology

- **Core**: Vanilla HTML5, CSS3, JavaScript (ES5 IIFEs).
- **Styling**: Pure CSS with custom skeuomorphic design (no frameworks).
- **Audio**: Web Audio API for all synthesis, effects, and capture.
- **Fonts**: Orbitron (display), DM Mono (monospace) via Google Fonts.

## 📜 Credits & Attribution

### Visualizer Engine
https://www.cssscript.com/innovative-audio-visualizer-power/ used for the oscilloscope visualizer.
> **Note**: `poweraudio.js` is a third-party library and is **not** created by the author of this project.

## 🚀 How to Run

1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. Click **PLAY** or press **Space** to start the sequencer.

## Live - www.harmonix.rocks