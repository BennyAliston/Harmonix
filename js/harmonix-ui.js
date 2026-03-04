/* ═══════════════════════════════════════════
   HARMONIX v3.0 — UI Builders & Interactions
   DOM construction, knobs, faders, visualizer
   ═══════════════════════════════════════════ */
(function() {
'use strict';

// ─── SEQUENCER BUILDER ────────────────────
function buildSequencer(container, instruments, steps, grid, callbacks) {
  container.innerHTML = '';
  var gridEl = document.createElement('div');
  gridEl.className = 'sequencer-grid';
  gridEl.style.gridTemplateColumns = '70px repeat(' + steps + ', 1fr)';

  // Beat markers row
  var emptyMarker = document.createElement('div');
  emptyMarker.className = 'beat-marker';
  gridEl.appendChild(emptyMarker);

  for (var s = 0; s < steps; s++) {
    var marker = document.createElement('div');
    marker.className = 'beat-marker' + (s % 4 === 0 ? ' downbeat' : '');
    marker.textContent = s + 1;
    gridEl.appendChild(marker);
  }

  // Instrument rows
  for (var r = 0; r < instruments.length; r++) {
    var inst = instruments[r];

    var label = document.createElement('div');
    label.className = 'seq-label';
    label.style.color = inst.color;
    label.textContent = inst.name;
    gridEl.appendChild(label);

    for (var ss = 0; ss < steps; ss++) {
      (function(row, step) {
        var cell = document.createElement('div');
        cell.className = 'seq-cell';
        cell.dataset.row = row;
        cell.dataset.step = step;
        cell.style.setProperty('--cell-color', inst.color);
        cell.style.setProperty('--cell-glow', inst.color + '80');

        if (grid[row][step]) cell.classList.add('active');

        cell.addEventListener('click', function() {
          grid[row][step] = !grid[row][step];
          cell.classList.toggle('active', grid[row][step]);
          if (callbacks.onCellToggle) callbacks.onCellToggle(row, step, grid[row][step]);
        });

        cell.addEventListener('touchstart', function(e) {
          e.preventDefault();
          grid[row][step] = !grid[row][step];
          cell.classList.toggle('active', grid[row][step]);
          if (callbacks.onCellToggle) callbacks.onCellToggle(row, step, grid[row][step]);
        }, { passive: false });

        gridEl.appendChild(cell);
      })(r, ss);
    }
  }

  container.appendChild(gridEl);
}

function refreshSequencerGrid(grid) {
  var cells = document.querySelectorAll('.seq-cell');
  cells.forEach(function(cell) {
    var r = parseInt(cell.dataset.row);
    var s = parseInt(cell.dataset.step);
    cell.classList.toggle('active', grid[r][s]);
  });
}

function highlightStep(stepIndex) {
  document.querySelectorAll('.seq-cell.step-highlight').forEach(function(c) {
    c.classList.remove('step-highlight');
  });
  document.querySelectorAll('.seq-cell[data-step="' + stepIndex + '"]').forEach(function(c) {
    c.classList.add('step-highlight');
  });
}

function clearStepHighlights() {
  document.querySelectorAll('.seq-cell.step-highlight').forEach(function(c) {
    c.classList.remove('step-highlight');
  });
}

// ─── MIXER BUILDER ────────────────────────
function buildMixer(container, instruments, volumes, muted, callbacks) {
  container.innerHTML = '';

  for (var r = 0; r < instruments.length; r++) {
    (function(index) {
      var inst = instruments[index];
      var channel = document.createElement('div');
      channel.className = 'mixer-channel';

      var label = document.createElement('div');
      label.className = 'ch-label';
      label.style.color = inst.color;
      label.textContent = inst.name;

      var track = document.createElement('div');
      track.className = 'fader-track';

      var fill = document.createElement('div');
      fill.className = 'fader-fill';
      fill.style.background = 'linear-gradient(to top, ' + inst.color + '44, ' + inst.color + ')';
      fill.style.height = (volumes[index] * 100) + '%';

      var thumb = document.createElement('div');
      thumb.className = 'fader-thumb';
      thumb.style.bottom = (volumes[index] * 100) + '%';
      thumb.style.transform = 'translate(-50%, 50%)';

      track.appendChild(fill);
      track.appendChild(thumb);

      var valDisplay = document.createElement('div');
      valDisplay.className = 'fader-value';
      valDisplay.textContent = Math.round(volumes[index] * 100);

      // Buttons row
      var btnsRow = document.createElement('div');
      btnsRow.className = 'channel-btns';

      var muteBtn = document.createElement('button');
      muteBtn.className = 'mute-btn' + (muted[index] ? ' muted' : '');
      muteBtn.textContent = 'M';
      muteBtn.setAttribute('data-tooltip', 'Mute/unmute');
      muteBtn.addEventListener('click', function() {
        muted[index] = !muted[index];
        muteBtn.classList.toggle('muted', muted[index]);
        if (callbacks.onMuteToggle) callbacks.onMuteToggle(index, muted[index]);
      });

      btnsRow.appendChild(muteBtn);

      // Fader drag logic
      var dragging = false;
      function updateFader(clientY) {
        var rect = track.getBoundingClientRect();
        var pct = 1 - (clientY - rect.top) / rect.height;
        pct = Math.max(0, Math.min(1, pct));
        volumes[index] = pct;
        fill.style.height = (pct * 100) + '%';
        thumb.style.bottom = (pct * 100) + '%';
        valDisplay.textContent = Math.round(pct * 100);
        if (callbacks.onVolumeChange) callbacks.onVolumeChange(index, pct);
      }

      thumb.addEventListener('mousedown', function(e) { dragging = true; e.preventDefault(); });
      thumb.addEventListener('touchstart', function(e) { dragging = true; e.preventDefault(); }, { passive: false });
      track.addEventListener('mousedown', function(e) {
        if (e.target === thumb) return;
        dragging = true; updateFader(e.clientY);
      });
      track.addEventListener('touchstart', function(e) {
        if (e.target === thumb) return;
        dragging = true; updateFader(e.touches[0].clientY);
      }, { passive: false });

      window.addEventListener('mousemove', function(e) { if (dragging) updateFader(e.clientY); });
      window.addEventListener('touchmove', function(e) { if (dragging) updateFader(e.touches[0].clientY); }, { passive: false });
      window.addEventListener('mouseup', function() { dragging = false; });
      window.addEventListener('touchend', function() { dragging = false; });

      channel.appendChild(label);
      channel.appendChild(track);
      channel.appendChild(valDisplay);
      channel.appendChild(btnsRow);
      container.appendChild(channel);
    })(r);
  }
}

// ─── KEYBOARD BUILDER ─────────────────────
var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function buildKeyboard(container, callbacks) {
  container.innerHTML = '';
  var startOctave = 3;
  var numOctaves = 3;

  for (var oct = startOctave; oct < startOctave + numOctaves; oct++) {
    for (var n = 0; n < 12; n++) {
      (function(noteName, octave, noteIndex) {
        var isBlack = noteName.includes('#');
        var freq = 440 * Math.pow(2, (octave - 4) + (noteIndex - 9) / 12);
        var fullLabel = noteName + octave;

        var key = document.createElement('div');
        key.className = 'key ' + (isBlack ? 'key-black' : 'key-white');
        key.dataset.note = fullLabel;
        key.dataset.freq = freq;
        key.dataset.noteBase = noteName;
        key.textContent = isBlack ? noteName : fullLabel;

        var noteActive = null;

        function noteOn() {
          if (noteActive) return;
          key.classList.add('pressed');
          noteActive = true;
          if (callbacks.onNoteOn) {
            noteActive = callbacks.onNoteOn(freq);
          }
        }

        function noteOff() {
          key.classList.remove('pressed');
          if (noteActive && callbacks.onNoteOff) {
            callbacks.onNoteOff(noteActive);
          }
          noteActive = null;
        }

        key.addEventListener('mousedown', function(e) { e.preventDefault(); noteOn(); });
        key.addEventListener('mouseup', noteOff);
        key.addEventListener('mouseleave', noteOff);
        key.addEventListener('mouseenter', function(e) { if (e.buttons === 1) noteOn(); });

        key.addEventListener('touchstart', function(e) { e.preventDefault(); noteOn(); }, { passive: false });
        key.addEventListener('touchend', function(e) { e.preventDefault(); noteOff(); });
        key.addEventListener('touchcancel', noteOff);

        container.appendChild(key);
      })(NOTE_NAMES[n], oct, n);
    }
  }
}

function updateKeyboardScale(rootKeyIndex, scaleIntervals) {
  var keys = document.querySelectorAll('#keyboard .key');
  keys.forEach(function(keyEl) {
    var noteBase = keyEl.dataset.noteBase;
    var noteIndex = NOTE_NAMES.indexOf(noteBase);
    var interval = ((noteIndex - rootKeyIndex) + 12) % 12;
    var inScale = scaleIntervals.indexOf(interval) !== -1;
    keyEl.classList.toggle('out-of-scale', !inScale);
  });
}

// ─── SVG KNOB ─────────────────────────────
function drawKnob(svgEl, value, color) {
  var cx = 32, cy = 32, r = 24;
  var startAngle = 225;
  var range = 270;
  var angle = startAngle - (value / 100) * range;
  var rad = angle * Math.PI / 180;

  var px = cx + Math.cos(rad) * (r - 4);
  var py = cy - Math.sin(rad) * (r - 4);

  var ticks = '';
  for (var i = 0; i <= 10; i++) {
    var a = (startAngle - (i / 10) * range) * Math.PI / 180;
    var x1 = cx + Math.cos(a) * (r + 2);
    var y1 = cy - Math.sin(a) * (r + 2);
    var x2 = cx + Math.cos(a) * (r + 5);
    var y2 = cy - Math.sin(a) * (r + 5);
    var opacity = i <= (value / 10) ? 1 : 0.25;
    ticks += '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="1.5" opacity="'+opacity+'"/>';
  }

  var bgStart = startAngle * Math.PI / 180;
  var bgEnd = (startAngle - range) * Math.PI / 180;
  var bgX1 = cx + Math.cos(bgStart) * r;
  var bgY1 = cy - Math.sin(bgStart) * r;
  var bgX2 = cx + Math.cos(bgEnd) * r;
  var bgY2 = cy - Math.sin(bgEnd) * r;

  var actEnd = angle * Math.PI / 180;
  var actX2 = cx + Math.cos(actEnd) * r;
  var actY2 = cy - Math.sin(actEnd) * r;
  var largeArc = (value / 100 * range) > 180 ? 1 : 0;

  svgEl.innerHTML =
    '<defs>' +
    '<linearGradient id="knobGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#2a2a2a"/>' +
    '<stop offset="100%" stop-color="#1a1a1a"/>' +
    '</linearGradient>' +
    '<radialGradient id="knobShine" cx="40%" cy="35%" r="50%">' +
    '<stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>' +
    '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>' +
    '</radialGradient>' +
    '</defs>' +
    ticks +
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-8)+'" fill="#1a1a1a" stroke="#333" stroke-width="2"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-10)+'" fill="url(#knobGrad)"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-10)+'" fill="url(#knobShine)"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-8)+'" fill="none" stroke="#2a2a2a" stroke-width="5"/>' +
    '<path d="M '+bgX1+' '+bgY1+' A '+r+' '+r+' 0 1 0 '+bgX2+' '+bgY2+'" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M '+bgX1+' '+bgY1+' A '+r+' '+r+' 0 '+largeArc+' 0 '+actX2+' '+actY2+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round" opacity="0.8"/>' +
    '<line x1="'+cx+'" y1="'+cy+'" x2="'+px+'" y2="'+py+'" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="'+color+'" opacity="0.6"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="2" fill="#fff" opacity="0.3"/>';
}

function buildKnobs(effectsContainer, knobDefs, knobValues, callbacks) {
  effectsContainer.innerHTML = '';

  knobDefs.forEach(function(def) {
    var group = document.createElement('div');
    group.className = 'knob-group';
    group.setAttribute('data-tooltip', def.tooltip);

    var label = document.createElement('div');
    label.className = 'knob-label';
    label.textContent = def.label;

    var container = document.createElement('div');
    container.className = 'knob-container';
    container.id = 'knob-' + def.param;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'knob-svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.id = 'knob-' + def.param + '-svg';
    container.appendChild(svg);

    var valEl = document.createElement('div');
    valEl.className = 'knob-value';
    valEl.id = 'knob-' + def.param + '-val';
    valEl.textContent = knobValues[def.param] + '%';

    drawKnob(svg, knobValues[def.param], '#ffaa33');

    // Drag logic
    var dragging = false;
    var startY, startVal;

    function update(val) {
      val = Math.max(0, Math.min(100, Math.round(val)));
      knobValues[def.param] = val;
      valEl.textContent = val + '%';
      drawKnob(svg, val, '#ffaa33');
      if (callbacks.onKnobChange) callbacks.onKnobChange(def.param, val);
    }

    container.addEventListener('mousedown', function(e) {
      dragging = true; startY = e.clientY; startVal = knobValues[def.param]; e.preventDefault();
    });
    container.addEventListener('touchstart', function(e) {
      dragging = true; startY = e.touches[0].clientY; startVal = knobValues[def.param]; e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      update(startVal + (startY - e.clientY) * 0.5);
    });
    window.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      update(startVal + (startY - e.touches[0].clientY) * 0.5);
    }, { passive: false });
    window.addEventListener('mouseup', function() { dragging = false; });
    window.addEventListener('touchend', function() { dragging = false; });

    group.appendChild(label);
    group.appendChild(container);
    group.appendChild(valEl);
    effectsContainer.appendChild(group);
  });
}

// ─── OSCILLOSCOPE ─────────────────────────
function buildVisualizer(container) {
  var viz = new PowerAudio.Viz({
    container: container,
    startAnalysis: false
  });

  function setAnalyser(a) {
    if (a) {
      viz.options.externalAnalyser = a;
      viz.start();
    }
  }

  return {
    setAnalyser: setAnalyser
  };
}

// ─── EXPORT ───────────────────────────────
window.HarmonixUI = {
  buildSequencer: buildSequencer,
  refreshSequencerGrid: refreshSequencerGrid,
  highlightStep: highlightStep,
  clearStepHighlights: clearStepHighlights,
  buildMixer: buildMixer,
  buildKeyboard: buildKeyboard,
  updateKeyboardScale: updateKeyboardScale,
  buildKnobs: buildKnobs,
  drawKnob: drawKnob,
  buildVisualizer: buildVisualizer,
  NOTE_NAMES: NOTE_NAMES
};

})();
