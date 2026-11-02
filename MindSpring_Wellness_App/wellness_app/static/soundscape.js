/**
 * MindSpring Procedural Web Audio Sound Sanctuary
 * Generates continuous, high-quality ambient soundscapes entirely in the browser.
 * Zero external audio files or copyright concerns.
 */

let audioCtx = null;
let isPlaying = false;

// Channel state
const channels = {
  rain: { gainNode: null, source: null, volume: 0.5, active: false },
  ocean: { gainNode: null, source: null, lfo: null, volume: 0.4, active: false },
  brown: { gainNode: null, source: null, volume: 0.3, active: false },
  bowl: { gainNode: null, oscs: [], volume: 0.25, active: false }
};

let masterGain = null;
let visualizerAnimation = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 1. Brown Noise Generator Buffer (Looping 5 seconds)
function createBrownNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Gain compensation
  }
  return buffer;
}

// 2. White Noise Generator Buffer (for Rain)
function createWhiteNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Start Rain Channel
function startRain() {
  const rainBuffer = createWhiteNoiseBuffer();
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = rainBuffer;
  noiseSource.loop = true;

  // Filter white noise to sound like soothing rain
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(channels.rain.volume, audioCtx.currentTime);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noiseSource.start();
  channels.rain.source = noiseSource;
  channels.rain.gainNode = gain;
}

// Start Ocean Channel (Brown noise modulated by slow LFO)
function startOcean() {
  const brownBuffer = createBrownNoiseBuffer();
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = brownBuffer;
  noiseSource.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(channels.ocean.volume, audioCtx.currentTime);

  // LFO to create swelling waves every ~7 seconds
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(0.14, audioCtx.currentTime); // ~7s cycle
  lfoGain.gain.setValueAtTime(channels.ocean.volume * 0.7, audioCtx.currentTime);

  lfo.connect(lfoGain.gain);
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noiseSource.start();
  lfo.start();

  channels.ocean.source = noiseSource;
  channels.ocean.lfo = lfo;
  channels.ocean.gainNode = gain;
}

// Start Pure Brown Noise Channel (ADHD & Deep Focus)
function startBrown() {
  const brownBuffer = createBrownNoiseBuffer();
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = brownBuffer;
  noiseSource.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(channels.brown.volume, audioCtx.currentTime);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noiseSource.start();
  channels.brown.source = noiseSource;
  channels.brown.gainNode = gain;
}

// Start Tibetan Singing Bowl Channel (432 Hz + Harmonics)
function startBowl() {
  const freqs = [432, 864, 1296];
  const oscs = [];
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(channels.bowl.volume * 0.6, audioCtx.currentTime);

  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    const oscGain = audioCtx.createGain();
    const subVol = idx === 0 ? 0.6 : idx === 1 ? 0.3 : 0.15;
    oscGain.gain.setValueAtTime(subVol, audioCtx.currentTime);

    // Subtle tremolo
    const tremolo = audioCtx.createOscillator();
    tremolo.frequency.setValueAtTime(0.2 + idx * 0.1, audioCtx.currentTime);
    const tremoloGain = audioCtx.createGain();
    tremoloGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    tremolo.connect(tremoloGain);
    tremoloGain.connect(oscGain.gain);
    tremolo.start();

    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start();
    oscs.push(osc, tremolo);
  });

  gain.connect(masterGain);
  channels.bowl.gainNode = gain;
  channels.bowl.oscs = oscs;
}

function stopAll() {
  Object.keys(channels).forEach(key => {
    const ch = channels[key];
    if (ch.source) {
      try { ch.source.stop(); } catch (e) {}
      ch.source = null;
    }
    if (ch.lfo) {
      try { ch.lfo.stop(); } catch (e) {}
      ch.lfo = null;
    }
    if (ch.oscs && ch.oscs.length) {
      ch.oscs.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      ch.oscs = [];
    }
    ch.gainNode = null;
  });
  if (visualizerAnimation) {
    cancelAnimationFrame(visualizerAnimation);
    visualizerAnimation = null;
  }
}

function toggleMasterPlay() {
  initAudioContext();
  const playBtn = document.getElementById('masterPlayBtn');
  const playIcon = document.getElementById('masterPlayIcon');
  const playLabel = document.getElementById('masterPlayLabel');

  if (isPlaying) {
    stopAll();
    isPlaying = false;
    if (playBtn) playBtn.classList.remove('btn-success');
    if (playIcon) playIcon.textContent = '▶';
    if (playLabel) playLabel.textContent = 'Play Sanctuary';
    document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active-sound'));
  } else {
    isPlaying = true;
    if (playBtn) playBtn.classList.add('btn-success');
    if (playIcon) playIcon.textContent = '⏸';
    if (playLabel) playLabel.textContent = 'Pause Sanctuary';

    // Start active channels
    if (channels.rain.active) startRain();
    if (channels.ocean.active) startOcean();
    if (channels.brown.active) startBrown();
    if (channels.bowl.active) startBowl();

    // Default to rain if nothing active
    if (!channels.rain.active && !channels.ocean.active && !channels.brown.active && !channels.bowl.active) {
      channels.rain.active = true;
      const rainToggle = document.getElementById('toggle-rain');
      if (rainToggle) rainToggle.checked = true;
      startRain();
    }

    startVisualizer();
  }
}

function updateChannelVolume(name, val) {
  const norm = parseFloat(val) / 100;
  channels[name].volume = norm;
  if (channels[name].gainNode && audioCtx) {
    channels[name].gainNode.gain.setTargetAtTime(norm, audioCtx.currentTime, 0.05);
  }
}

function toggleChannel(name, isChecked) {
  channels[name].active = isChecked;
  const card = document.getElementById(`card-${name}`);
  if (card) {
    card.classList.toggle('active-sound', isChecked && isPlaying);
  }

  if (!isPlaying) return;

  initAudioContext();
  if (isChecked) {
    if (name === 'rain' && !channels.rain.source) startRain();
    if (name === 'ocean' && !channels.ocean.source) startOcean();
    if (name === 'brown' && !channels.brown.source) startBrown();
    if (name === 'bowl' && !channels.bowl.oscs.length) startBowl();
  } else {
    const ch = channels[name];
    if (ch.source) {
      try { ch.source.stop(); } catch (e) {}
      ch.source = null;
    }
    if (ch.lfo) {
      try { ch.lfo.stop(); } catch (e) {}
      ch.lfo = null;
    }
    if (ch.oscs && ch.oscs.length) {
      ch.oscs.forEach(osc => { try { osc.stop(); } catch (e) {} });
      ch.oscs = [];
    }
  }
}

function applyPreset(preset) {
  const configs = {
    study: { rain: 0.3, ocean: 0.0, brown: 0.6, bowl: 0.0 },
    rainy: { rain: 0.7, ocean: 0.2, brown: 0.0, bowl: 0.2 },
    calm: { rain: 0.2, ocean: 0.5, brown: 0.2, bowl: 0.4 },
    sleep: { rain: 0.4, ocean: 0.4, brown: 0.4, bowl: 0.0 }
  };

  const cfg = configs[preset];
  if (!cfg) return;

  Object.keys(cfg).forEach(key => {
    const vol = cfg[key];
    const slider = document.getElementById(`slider-${key}`);
    const toggle = document.getElementById(`toggle-${key}`);

    if (slider) slider.value = vol * 100;
    if (toggle) toggle.checked = vol > 0;

    channels[key].volume = vol;
    toggleChannel(key, vol > 0);
  });

  if (!isPlaying) {
    toggleMasterPlay();
  }
}

// Simple Canvas Visualizer
function startVisualizer() {
  const canvas = document.getElementById('soundCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bars = 32;
    const barWidth = canvas.width / bars - 2;

    for (let i = 0; i < bars; i++) {
      const height = Math.sin(Date.now() * 0.005 + i * 0.2) * 15 + Math.random() * 18 + 8;
      const x = i * (barWidth + 2);
      const y = canvas.height - height;

      ctx.fillStyle = '#6b9080';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, [4, 4, 0, 0]);
      ctx.fill();
    }

    visualizerAnimation = requestAnimationFrame(draw);
  }
  draw();
}
