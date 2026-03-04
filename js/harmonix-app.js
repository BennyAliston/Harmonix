/* ═══════════════════════════════════════════
   HARMONIX v3.0 — App Controller
   Router, state, presets, scales, WAV export
   ═══════════════════════════════════════════ */
(function() {
'use strict';

var Engine = window.HarmonixEngine;
var UI = window.HarmonixUI;

// ─── INSTRUMENTS ──────────────────────────
var INSTRUMENTS = [
  { name: 'KICK',   color: '#ffaa33', type: 'kick' },
  { name: 'SNARE',  color: '#33ffcc', type: 'snare' },
  { name: 'HI-HAT', color: '#ff6655', type: 'hihat' },
  { name: 'CLAP',   color: '#aaff33', type: 'clap' },
  { name: 'TOM',    color: '#bb77ff', type: 'tom' },
  { name: 'BASS',   color: '#ff77aa', type: 'bass' },
  { name: 'SYNTH',  color: '#55bbff', type: 'synth' },
  { name: 'PERC',   color: '#ffdd44', type: 'perc' }
];

Engine._instruments = INSTRUMENTS;
var STEPS = 16;

// ─── STATE ────────────────────────────────
var grid = [];
var volumes = [];
var muted = [];
var bpm = 120;
var swing = 0;
var loopEnabled = true;
var knobValues = { reverb: 20, delay: 15, filter: 100 };
var selectedKey = 0; // C
var selectedScale = 'chromatic';
var isRecording = false;

// Init grid
for (var r = 0; r < INSTRUMENTS.length; r++) {
  grid[r] = new Array(STEPS).fill(false);
  volumes[r] = 0.75;
  muted[r] = false;
}

// ─── PRESETS ──────────────────────────────
var PRESETS = {
  'empty':       { name: '-- Empty --', bpm: 120, swing: 0, pattern: [[],[],[],[],[],[],[],[]] },
  'hip-hop':     { name: 'Hip-Hop', bpm: 90, swing: 45, pattern: [
    [0,6,8,14], [4,12], [0,2,4,6,8,10,12,14], [4,12], [10], [0,3,6,8,11,14], [0,8], [2,6,10,14]
  ]},
  'house':       { name: 'House', bpm: 124, swing: 0, pattern: [
    [0,4,8,12], [4,12], [2,6,10,14], [4,12], [], [0,3,8,11], [0,6,8,14], [4,12]
  ]},
  'techno':      { name: 'Techno', bpm: 132, swing: 0, pattern: [
    [0,4,8,12], [4,12], [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], [], [7,15], [0,8], [2,10], [0,4,8,12]
  ]},
  'jazz':        { name: 'Jazz Swing', bpm: 110, swing: 65, pattern: [
    [0,10], [4,12], [0,2,4,6,8,10,12,14], [], [6,14], [0,4,8,12], [2,10], [0,6,8,14]
  ]},
  'dnb':         { name: 'Drum & Bass', bpm: 174, swing: 0, pattern: [
    [0,10], [4,14], [0,2,4,6,8,10,12,14], [4], [], [0,3,6,10,13], [0,8], [2,6,10,14]
  ]},
  'trap':        { name: 'Trap', bpm: 140, swing: 0, pattern: [
    [0,7,8], [4,12], [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], [4,12], [], [0,3,8,11], [0], [2,5,6,10,13,14]
  ]},
  'reggaeton':   { name: 'Reggaeton', bpm: 96, swing: 0, pattern: [
    [0,4,8,12], [3,7,11,15], [0,2,4,6,8,10,12,14], [3,7,11,15], [], [0,6,8,14], [0,8], [4,12]
  ]}
};

// ─── SCALES ───────────────────────────────
var SCALES = {
  'chromatic':        { name: 'Chromatic',        intervals: [0,1,2,3,4,5,6,7,8,9,10,11] },
  'major':            { name: 'Major',            intervals: [0,2,4,5,7,9,11] },
  'minor':            { name: 'Minor',            intervals: [0,2,3,5,7,8,10] },
  'pentatonic-major': { name: 'Penta Major',      intervals: [0,2,4,7,9] },
  'pentatonic-minor': { name: 'Penta Minor',      intervals: [0,3,5,7,10] },
  'blues':            { name: 'Blues',             intervals: [0,3,5,6,7,10] },
  'dorian':           { name: 'Dorian',           intervals: [0,2,3,5,7,9,10] },
  'mixolydian':       { name: 'Mixolydian',       intervals: [0,2,4,5,7,9,10] },
  'harmonic-minor':   { name: 'Harmonic Minor',   intervals: [0,2,3,5,7,8,11] },
  'phrygian':         { name: 'Phrygian',         intervals: [0,1,3,5,7,8,10] },
  'lydian':           { name: 'Lydian',           intervals: [0,2,4,6,7,9,11] },
  'whole-tone':       { name: 'Whole Tone',       intervals: [0,2,4,6,8,10] }
};

var KEY_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ─── ROUTER ───────────────────────────────
var PAGES = ['sequencer', 'mixer', 'keys', 'effects'];

function handleRoute() {
  var hash = window.location.hash.slice(1) || 'sequencer';
  var activePage = PAGES.indexOf(hash) !== -1 ? hash : 'sequencer';

  PAGES.forEach(function(p) {
    var el = document.getElementById('page-' + p);
    if (el) {
      el.classList.toggle('active', p === activePage);
    }
  });

  document.querySelectorAll('.nav-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.dataset.page === activePage);
  });
}

window.addEventListener('hashchange', handleRoute);

// ─── PRESET LOADING ──────────────────────
function loadPreset(key) {
  var preset = PRESETS[key];
  if (!preset) return;

  // Clear grid
  for (var r2 = 0; r2 < INSTRUMENTS.length; r2++) {
    grid[r2] = new Array(STEPS).fill(false);
  }

  // Set pattern
  for (var r3 = 0; r3 < preset.pattern.length && r3 < INSTRUMENTS.length; r3++) {
    for (var i = 0; i < preset.pattern[r3].length; i++) {
      var step = preset.pattern[r3][i];
      if (step >= 0 && step < STEPS) grid[r3][step] = true;
    }
  }

  // Set bpm & swing
  bpm = preset.bpm;
  swing = preset.swing;
  document.getElementById('bpm-slider').value = bpm;
  document.getElementById('bpm-display').textContent = bpm;
  document.getElementById('swing-slider').value = swing;
  document.getElementById('swing-display').textContent = swing + '%';

  UI.refreshSequencerGrid(grid);
  debouncedSave();
}

function clearGrid() {
  for (var r4 = 0; r4 < INSTRUMENTS.length; r4++) {
    grid[r4] = new Array(STEPS).fill(false);
  }
  UI.refreshSequencerGrid(grid);
  debouncedSave();
}

function randomizeGrid() {
  for (var r5 = 0; r5 < INSTRUMENTS.length; r5++) {
    for (var s = 0; s < STEPS; s++) {
      // Different density per instrument type
      var density = r5 < 3 ? 0.3 : (r5 < 5 ? 0.15 : 0.2);
      grid[r5][s] = Math.random() < density;
    }
  }
  UI.refreshSequencerGrid(grid);
  debouncedSave();
}

// ─── SCALE APPLICATION ───────────────────
function applyScale() {
  var scaleData = SCALES[selectedScale];
  if (!scaleData) return;
  UI.updateKeyboardScale(selectedKey, scaleData.intervals);
}

// ─── WAV EXPORT ──────────────────────────
function writeString(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(leftChannel, rightChannel, sampleRate) {
  var numChannels = 2;
  var bitDepth = 16;
  var bytesPerSample = bitDepth / 8;
  var blockAlign = numChannels * bytesPerSample;
  var numSamples = leftChannel.length;
  var dataLength = numSamples * blockAlign;
  var buffer = new ArrayBuffer(44 + dataLength);
  var view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  var offset = 44;
  for (var i = 0; i < numSamples; i++) {
    var ls = Math.max(-1, Math.min(1, leftChannel[i]));
    var rs = Math.max(-1, Math.min(1, rightChannel[i]));
    view.setInt16(offset, ls * 0x7FFF, true); offset += 2;
    view.setInt16(offset, rs * 0x7FFF, true); offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function handleExport() {
  var statusEl = document.getElementById('export-status');
  var btnEl = document.getElementById('btn-export');

  if (isRecording) {
    isRecording = false;
    Engine.stopSequencer();
    var channels = Engine.stopCapture();
    Engine.disconnectCapture();

    statusEl.textContent = 'ENCODING...';
    document.getElementById('btn-play').classList.remove('active');

    setTimeout(function() {
      var blob = encodeWAV(channels[0], channels[1], Engine.getSampleRate());
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'harmonix-export-' + Date.now() + '.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      statusEl.textContent = 'EXPORTED!';
      btnEl.classList.remove('recording');
      setTimeout(function() { statusEl.textContent = 'READY'; }, 3000);
    }, 100);
  } else {
    Engine.init();
    Engine.connectCapture();
    Engine.startCapture();
    isRecording = true;

    statusEl.textContent = 'REC...';
    btnEl.classList.add('recording');

    // Stop current and restart fresh
    if (Engine.isPlaying()) {
      Engine.stopSequencer();
      UI.clearStepHighlights();
    }

    document.getElementById('btn-play').classList.add('active');

    Engine.startSequencer(grid, volumes, muted, bpm, swing, false, function(step) {
      UI.highlightStep(step);
    }, function() {
      // Sequencer finished one loop — wait a bit for reverb tail then stop capture
      setTimeout(function() {
        if (isRecording) handleExport();
      }, 300);
    });
  }
}

// ─── LOCALSTORAGE ─────────────────────────
var STORAGE_KEY = 'harmonix-state-v3';
var saveTimeout = null;

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveState, 500);
}

function saveState() {
  try {
    var state = {
      grid: grid, volumes: volumes, muted: muted,
      knobValues: knobValues, bpm: bpm, swing: swing,
      loopEnabled: loopEnabled, selectedKey: selectedKey,
      selectedScale: selectedScale
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* silent */ }
}

function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    var s = JSON.parse(saved);
    if (s.grid && s.grid.length === INSTRUMENTS.length) grid = s.grid;
    if (s.volumes) volumes = s.volumes;
    if (s.muted) muted = s.muted;
    if (s.knobValues) knobValues = s.knobValues;
    if (typeof s.bpm === 'number') bpm = s.bpm;
    if (typeof s.swing === 'number') swing = s.swing;
    if (typeof s.loopEnabled === 'boolean') loopEnabled = s.loopEnabled;
    if (typeof s.selectedKey === 'number') selectedKey = s.selectedKey;
    if (typeof s.selectedScale === 'string') selectedScale = s.selectedScale;
    return true;
  } catch (e) { return false; }
}

// ─── PLAYBACK HELPERS ─────────────────────
function startPlayback() {
  Engine.init();
  Engine.startSequencer(grid, volumes, muted, bpm, swing, loopEnabled, function(step) {
    UI.highlightStep(step);
  }, function() {
    document.getElementById('btn-play').classList.remove('active');
    document.getElementById('btn-stop').classList.add('active');
    UI.clearStepHighlights();
  });
  document.getElementById('btn-play').classList.add('active');
  document.getElementById('btn-stop').classList.remove('active');
}

function stopPlayback() {
  Engine.stopSequencer();
  document.getElementById('btn-play').classList.remove('active');
  document.getElementById('btn-stop').classList.add('active');
  UI.clearStepHighlights();
}

// ─── INIT ─────────────────────────────────
function init() {
  // Load saved state
  var hasState = loadState();

  // Set up navigation tabs
  document.querySelectorAll('.nav-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      window.location.hash = tab.dataset.page;
    });
  });

  // Populate preset dropdown
  var presetDropdown = document.getElementById('preset-dropdown');
  Object.keys(PRESETS).forEach(function(key) {
    var opt = document.createElement('option');
    opt.value = key;
    opt.textContent = PRESETS[key].name;
    presetDropdown.appendChild(opt);
  });
  presetDropdown.addEventListener('change', function() {
    loadPreset(presetDropdown.value);
  });

  // Populate key dropdown
  var keyDropdown = document.getElementById('key-dropdown');
  KEY_NAMES.forEach(function(name, idx) {
    var opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = name;
    if (idx === selectedKey) opt.selected = true;
    keyDropdown.appendChild(opt);
  });
  keyDropdown.addEventListener('change', function() {
    selectedKey = parseInt(keyDropdown.value);
    applyScale();
    debouncedSave();
  });

  // Populate scale dropdown
  var scaleDropdown = document.getElementById('scale-dropdown');
  Object.keys(SCALES).forEach(function(key) {
    var opt = document.createElement('option');
    opt.value = key;
    opt.textContent = SCALES[key].name;
    if (key === selectedScale) opt.selected = true;
    scaleDropdown.appendChild(opt);
  });
  scaleDropdown.addEventListener('change', function() {
    selectedScale = scaleDropdown.value;
    applyScale();
    debouncedSave();
  });

  // Set slider values from state
  document.getElementById('bpm-slider').value = bpm;
  document.getElementById('bpm-display').textContent = bpm;
  document.getElementById('swing-slider').value = swing;
  document.getElementById('swing-display').textContent = swing + '%';

  // Build sequencer
  UI.buildSequencer(
    document.getElementById('sequencer-container'),
    INSTRUMENTS, STEPS, grid, {
      onCellToggle: function(row, step, active) {
        Engine.init();
        if (active) Engine.playInstrument(INSTRUMENTS[row].type, volumes[row]);
        debouncedSave();
      }
    }
  );

  // Build mixer
  UI.buildMixer(
    document.getElementById('mixer-container'),
    INSTRUMENTS, volumes, muted, {
      onVolumeChange: function() { debouncedSave(); },
      onMuteToggle: function() { debouncedSave(); }
    }
  );

  // Build keyboard
  UI.buildKeyboard(
    document.getElementById('keyboard'), {
      onNoteOn: function(freq) {
        Engine.init();
        return Engine.playNote(freq);
      },
      onNoteOff: function(noteRef) {
        Engine.stopNote(noteRef);
      }
    }
  );

  // Build knobs
  UI.buildKnobs(
    document.getElementById('effects-row'),
    [
      { param: 'reverb', label: 'REVERB', tooltip: 'Master reverb — adds space and depth' },
      { param: 'delay',  label: 'DELAY',  tooltip: 'Master delay — creates echo repeats' },
      { param: 'filter', label: 'FILTER', tooltip: 'Master filter — shapes overall brightness' }
    ],
    knobValues, {
      onKnobChange: function() {
        Engine.applyEffects(knobValues);
        debouncedSave();
      }
    }
  );

  // Build visualizer
  var visualizer = UI.buildVisualizer(document.getElementById('oscilloscope'));

  // Transport controls
  document.getElementById('btn-play').addEventListener('click', function() {
    if (Engine.isPlaying()) return;
    startPlayback();
  });

  document.getElementById('btn-stop').addEventListener('click', function() {
    stopPlayback();
  });

  var loopBtn = document.getElementById('btn-loop');
  loopBtn.classList.toggle('active', loopEnabled);
  loopBtn.addEventListener('click', function() {
    loopEnabled = !loopEnabled;
    loopBtn.classList.toggle('active', loopEnabled);
    debouncedSave();
  });

  // BPM
  var bpmSlider = document.getElementById('bpm-slider');
  var bpmDisplay = document.getElementById('bpm-display');
  bpmSlider.addEventListener('input', function() {
    bpm = parseInt(bpmSlider.value);
    bpmDisplay.textContent = bpm;
    debouncedSave();
  });

  // Swing
  var swingSlider = document.getElementById('swing-slider');
  var swingDisplay = document.getElementById('swing-display');
  swingSlider.addEventListener('input', function() {
    swing = parseInt(swingSlider.value);
    swingDisplay.textContent = swing + '%';
    debouncedSave();
  });

  // Clear and Random buttons
  document.getElementById('btn-clear').addEventListener('click', clearGrid);
  document.getElementById('btn-random').addEventListener('click', randomizeGrid);

  // Export button
  document.getElementById('btn-export').addEventListener('click', handleExport);

  // Keyboard shortcut: Space = play/stop
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      if (Engine.isPlaying()) stopPlayback();
      else startPlayback();
    }
  });

  // Apply initial effects
  // (Will take effect once audio context is initialized)
  var pendingEffects = true;

  // Watch for first audio init to connect analyser and apply effects
  var initCheck = setInterval(function() {
    var a = Engine.getAnalyser();
    if (a) {
      visualizer.setAnalyser(a);
      if (pendingEffects) {
        Engine.applyEffects(knobValues);
        pendingEffects = false;
      }
      clearInterval(initCheck);
    }
  }, 100);

  // Apply scale to keyboard
  applyScale();

  // Load demo pattern if no saved state
  if (!hasState) {
    loadPreset('house');
    // Reset dropdown to show house
    presetDropdown.value = 'house';
  }

  // Initialize route
  handleRoute();
}

// Run init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
