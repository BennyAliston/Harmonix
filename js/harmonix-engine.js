/* ═══════════════════════════════════════════
   HARMONIX v3.0 — Audio Engine
   Zero DOM dependencies. Pure Web Audio API.
   ═══════════════════════════════════════════ */
(function() {
'use strict';

var audioCtx = null;
var masterGain = null;
var analyser = null;
var convolver = null;
var reverbWet = null;
var delayNode = null;
var delayFeedback = null;
var delayWet = null;
var filterNode = null;

// Sequencer state
var _isPlaying = false;
var _currentStep = -1;
var _stepTimer = null;

// Capture state
var captureNode = null;
var captureBuffers = null;
var isCapturing = false;

// ─── INIT ─────────────────────────────────
function init() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.8;

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.85;

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 20000;
  filterNode.Q.value = 0.7;

  delayNode = audioCtx.createDelay(1.0);
  delayNode.delayTime.value = 0.3;
  delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.3;
  delayWet = audioCtx.createGain();
  delayWet.gain.value = 0.15;

  masterGain.connect(delayNode);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayWet);

  convolver = audioCtx.createConvolver();
  reverbWet = audioCtx.createGain();
  reverbWet.gain.value = 0.2;
  generateImpulse(2, 2.5);

  masterGain.connect(convolver);
  convolver.connect(reverbWet);
  reverbWet.connect(filterNode);

  masterGain.connect(filterNode); // dry path
  delayWet.connect(filterNode);

  filterNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function generateImpulse(duration, decay) {
  var rate = audioCtx.sampleRate;
  var length = rate * duration;
  var impulse = audioCtx.createBuffer(2, length, rate);
  for (var ch = 0; ch < 2; ch++) {
    var data = impulse.getChannelData(ch);
    for (var i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  convolver.buffer = impulse;
}

function getAudioContext() { return audioCtx; }
function getAnalyser() { return analyser; }

// ─── EFFECTS ──────────────────────────────
function applyEffects(knobValues) {
  if (!audioCtx) return;
  var rv = knobValues.reverb / 100;
  if (reverbWet) reverbWet.gain.value = rv * 0.6;

  var dv = knobValues.delay / 100;
  if (delayWet) delayWet.gain.value = dv * 0.5;
  if (delayFeedback) delayFeedback.gain.value = Math.min(dv * 0.6, 0.85);

  var fv = knobValues.filter / 100;
  if (filterNode) {
    var minF = 200, maxF = 20000;
    filterNode.frequency.value = minF * Math.pow(maxF / minF, fv);
  }
}

// ─── INSTRUMENT SYNTHESIS ─────────────────
function playInstrument(type, vol) {
  if (!audioCtx) init();
  var now = audioCtx.currentTime;
  var out = masterGain;

  switch (type) {
    case 'kick': {
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      g.gain.setValueAtTime(vol * 1.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g); g.connect(out);
      osc.start(now); osc.stop(now + 0.4);
      break;
    }
    case 'snare': {
      var bufSz = audioCtx.sampleRate * 0.15;
      var buf = audioCtx.createBuffer(1, bufSz, audioCtx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
      var noise = audioCtx.createBufferSource();
      noise.buffer = buf;
      var ng = audioCtx.createGain();
      ng.gain.setValueAtTime(vol * 0.8, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      var nf = audioCtx.createBiquadFilter();
      nf.type = 'highpass'; nf.frequency.value = 1000;
      noise.connect(nf); nf.connect(ng); ng.connect(out);
      noise.start(now);
      var osc2 = audioCtx.createOscillator();
      var g2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(200, now);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      g2.gain.setValueAtTime(vol * 0.6, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc2.connect(g2); g2.connect(out);
      osc2.start(now); osc2.stop(now + 0.15);
      break;
    }
    case 'hihat': {
      var bufSz2 = audioCtx.sampleRate * 0.08;
      var buf2 = audioCtx.createBuffer(1, bufSz2, audioCtx.sampleRate);
      var d2 = buf2.getChannelData(0);
      for (var j = 0; j < bufSz2; j++) d2[j] = Math.random() * 2 - 1;
      var n2 = audioCtx.createBufferSource();
      n2.buffer = buf2;
      var g3 = audioCtx.createGain();
      g3.gain.setValueAtTime(vol * 0.4, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      var hf = audioCtx.createBiquadFilter();
      hf.type = 'highpass'; hf.frequency.value = 7000;
      n2.connect(hf); hf.connect(g3); g3.connect(out);
      n2.start(now);
      break;
    }
    case 'clap': {
      for (var b = 0; b < 3; b++) {
        var t = now + b * 0.015;
        var bs = audioCtx.sampleRate * 0.02;
        var bb = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
        var dd = bb.getChannelData(0);
        for (var k = 0; k < bs; k++) dd[k] = Math.random() * 2 - 1;
        var nn = audioCtx.createBufferSource();
        nn.buffer = bb;
        var gg = audioCtx.createGain();
        gg.gain.setValueAtTime(vol * 0.5, t);
        gg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        var bf = audioCtx.createBiquadFilter();
        bf.type = 'bandpass'; bf.frequency.value = 2500; bf.Q.value = 2;
        nn.connect(bf); bf.connect(gg); gg.connect(out);
        nn.start(t);
      }
      break;
    }
    case 'tom': {
      var osc3 = audioCtx.createOscillator();
      var g4 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(250, now);
      osc3.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      g4.gain.setValueAtTime(vol * 0.9, now);
      g4.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc3.connect(g4); g4.connect(out);
      osc3.start(now); osc3.stop(now + 0.3);
      break;
    }
    case 'bass': {
      var osc4 = audioCtx.createOscillator();
      var g5 = audioCtx.createGain();
      osc4.type = 'sawtooth';
      osc4.frequency.value = 55;
      var ff = audioCtx.createBiquadFilter();
      ff.type = 'lowpass';
      ff.frequency.setValueAtTime(800, now);
      ff.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      g5.gain.setValueAtTime(vol * 0.7, now);
      g5.gain.setValueAtTime(vol * 0.7, now + 0.1);
      g5.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc4.connect(ff); ff.connect(g5); g5.connect(out);
      osc4.start(now); osc4.stop(now + 0.3);
      break;
    }
    case 'synth': {
      var o1 = audioCtx.createOscillator();
      var o2 = audioCtx.createOscillator();
      var g6 = audioCtx.createGain();
      o1.type = 'square'; o1.frequency.value = 330;
      o2.type = 'sawtooth'; o2.frequency.value = 332;
      g6.gain.setValueAtTime(vol * 0.35, now);
      g6.gain.setValueAtTime(vol * 0.35, now + 0.08);
      g6.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      o1.connect(g6); o2.connect(g6); g6.connect(out);
      o1.start(now); o2.start(now);
      o1.stop(now + 0.25); o2.stop(now + 0.25);
      break;
    }
    case 'perc': {
      var o3 = audioCtx.createOscillator();
      var g7 = audioCtx.createGain();
      o3.type = 'sine';
      o3.frequency.setValueAtTime(800, now);
      o3.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      g7.gain.setValueAtTime(vol * 0.5, now);
      g7.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      o3.connect(g7); g7.connect(out);
      o3.start(now); o3.stop(now + 0.08);
      var o4 = audioCtx.createOscillator();
      var g8 = audioCtx.createGain();
      o4.type = 'square'; o4.frequency.value = 1200;
      g8.gain.setValueAtTime(vol * 0.15, now);
      g8.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      o4.connect(g8); g8.connect(out);
      o4.start(now); o4.stop(now + 0.06);
      break;
    }
  }
}

// ─── KEYBOARD NOTE ────────────────────────
function playNote(freq) {
  if (!audioCtx) init();
  var now = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var osc2 = audioCtx.createOscillator();
  var g = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  osc2.type = 'square';
  osc2.frequency.value = freq * 1.002;

  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.25, now + 0.02);
  g.gain.setValueAtTime(0.25, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  var flt = audioCtx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(3000, now);
  flt.frequency.exponentialRampToValueAtTime(500, now + 0.6);
  flt.Q.value = 2;

  osc.connect(flt); osc2.connect(flt);
  flt.connect(g); g.connect(masterGain);
  osc.start(now); osc2.start(now);
  osc.stop(now + 0.8); osc2.stop(now + 0.8);

  return { osc: osc, osc2: osc2, gain: g };
}

function stopNote(noteRef) {
  if (!noteRef || !audioCtx) return;
  var now = audioCtx.currentTime;
  noteRef.gain.gain.cancelScheduledValues(now);
  noteRef.gain.gain.setValueAtTime(noteRef.gain.gain.value, now);
  noteRef.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
}

// ─── SEQUENCER ────────────────────────────
function startSequencer(grid, volumes, muted, bpm, swing, loopEnabled, onStep, onStop) {
  if (!audioCtx) init();
  if (_isPlaying) return;
  _isPlaying = true;
  _currentStep = -1;

  var STEPS = grid[0].length;

  function schedule() {
    if (!_isPlaying) return;
    _currentStep = (_currentStep + 1) % STEPS;

    var beatDuration = 60 / bpm;
    var stepDuration = beatDuration / 4;
    var delay;
    if (_currentStep % 2 === 0) {
      delay = stepDuration * (1 + swing / 200);
    } else {
      delay = stepDuration * (1 - swing / 200);
    }
    delay = Math.max(delay, 0.02);

    for (var r = 0; r < grid.length; r++) {
      if (grid[r][_currentStep] && !muted[r]) {
        playInstrument(window.HarmonixEngine._instruments[r].type, volumes[r]);
      }
    }

    if (onStep) onStep(_currentStep);

    if (_currentStep === STEPS - 1 && !loopEnabled) {
      _stepTimer = setTimeout(function() {
        _isPlaying = false;
        _currentStep = -1;
        _stepTimer = null;
        if (onStop) onStop();
      }, delay * 1000);
      return;
    }

    _stepTimer = setTimeout(schedule, delay * 1000);
  }

  schedule();
}

function stopSequencer() {
  _isPlaying = false;
  if (_stepTimer) {
    clearTimeout(_stepTimer);
    _stepTimer = null;
  }
  _currentStep = -1;
}

function isPlaying() { return _isPlaying; }
function getCurrentStep() { return _currentStep; }

// ─── AUDIO CAPTURE (WAV EXPORT) ───────────
function connectCapture() {
  if (!audioCtx) return;
  captureNode = audioCtx.createScriptProcessor(4096, 2, 2);
  captureBuffers = [[], []];

  captureNode.onaudioprocess = function(e) {
    if (!isCapturing) {
      // pass-through
      for (var ch = 0; ch < 2; ch++) {
        var inp = e.inputBuffer.getChannelData(ch);
        var outp = e.outputBuffer.getChannelData(ch);
        for (var i = 0; i < inp.length; i++) outp[i] = inp[i];
      }
      return;
    }
    for (var ch2 = 0; ch2 < 2; ch2++) {
      var input = e.inputBuffer.getChannelData(ch2);
      var output = e.outputBuffer.getChannelData(ch2);
      var copy = new Float32Array(input.length);
      for (var j = 0; j < input.length; j++) {
        output[j] = input[j];
        copy[j] = input[j];
      }
      captureBuffers[ch2].push(copy);
    }
  };

  // Insert: filterNode -> captureNode -> analyser
  filterNode.disconnect(analyser);
  filterNode.connect(captureNode);
  captureNode.connect(analyser);
}

function startCapture() {
  captureBuffers = [[], []];
  isCapturing = true;
}

function stopCapture() {
  isCapturing = false;
  return captureBuffers.map(function(chunks) {
    var total = chunks.reduce(function(s, c) { return s + c.length; }, 0);
    var result = new Float32Array(total);
    var offset = 0;
    chunks.forEach(function(chunk) {
      result.set(chunk, offset);
      offset += chunk.length;
    });
    return result;
  });
}

function disconnectCapture() {
  if (!captureNode) return;
  try {
    filterNode.disconnect(captureNode);
    captureNode.disconnect(analyser);
  } catch (e) {}
  filterNode.connect(analyser);
  captureNode = null;
  captureBuffers = null;
}

function getSampleRate() {
  return audioCtx ? audioCtx.sampleRate : 44100;
}

// ─── EXPORT ───────────────────────────────
window.HarmonixEngine = {
  _instruments: [], // set by app.js
  init: init,
  getAudioContext: getAudioContext,
  getAnalyser: getAnalyser,
  applyEffects: applyEffects,
  playInstrument: playInstrument,
  playNote: playNote,
  stopNote: stopNote,
  startSequencer: startSequencer,
  stopSequencer: stopSequencer,
  isPlaying: isPlaying,
  getCurrentStep: getCurrentStep,
  connectCapture: connectCapture,
  startCapture: startCapture,
  stopCapture: stopCapture,
  disconnectCapture: disconnectCapture,
  getSampleRate: getSampleRate
};

})();
