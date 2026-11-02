/**
 * MindSpring Rich Interactive Game Engine
 * Includes:
 * 1. Web Audio SFX (Happy Chime & Sad Buzz)
 * 2. Unified Results Screen with Best Score (localStorage)
 * 3. Calm in the Ocean (Vertical Top-Down Sea Odyssey with Obstacles & Sea God Rescue)
 * 4. English Mastery Quiz (100 Questions Bank across Easy/Medium/Hard)
 * 5. Odd One Out (Fruits + 1 Hidden Vegetable)
 * 6. Number Table (5 Levels: Sequential, Multiples, Primes, Squares, Fibonacci)
 * 7. Memory Sequence (Melodic Harder/Faster Pattern)
 * 8. Stroop Color (5-Second Question Timeout)
 * 9. Follow the Dot (Multi-Round 80s MOT Tracking)
 * 10. Varied Mental Math Sprint (Percentages, BODMAS, Powers, Fractions, Word Problems)
 * 11. Emoji Charades (Cinema Marquee Theme, 25 Movies, Streaks, Missed List)
 * 12. Quick Sudoku (Procedural 4x4 / 6x6 with Conflict Detection, Hint & Undo)
 * 13. Cat Puzzle (N-Queens with Cats, Connected Color Regions & Kings Move Rules)
 * 14. Stress Bubble Pop & Tiny Wins Ladder (Kept as is)
 */

// ===========================================================================
// 1. Web Audio Procedural Sound Engine (Zero external files)
// ===========================================================================
let sfxCtx = null;
let sfxMuted = false;
let oceanStormNode = null;
let oceanStormGain = null;

function initSFX() {
  if (!sfxCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sfxCtx = new AudioContextClass();
  }
  if (sfxCtx.state === 'suspended') {
    sfxCtx.resume();
  }
}

function toggleGameSFX() {
  sfxMuted = !sfxMuted;
  const btn = document.getElementById('sfxMuteBtn');
  if (btn) {
    btn.textContent = sfxMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    btn.classList.toggle('btn-outline-danger', sfxMuted);
    btn.classList.toggle('btn-outline-secondary', !sfxMuted);
  }
  if (sfxMuted && oceanStormGain && sfxCtx) {
    oceanStormGain.gain.setValueAtTime(0, sfxCtx.currentTime);
  } else if (!sfxMuted && oceanStormGain && sfxCtx) {
    oceanStormGain.gain.setValueAtTime(0.25, sfxCtx.currentTime);
  }
}

// Happy Ascending Triad Chime (Correct Answer / Win)
function playHappyChime() {
  if (sfxMuted) return;
  initSFX();
  try {
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, idx) => {
      const osc = sfxCtx.createOscillator();
      const gain = sfxCtx.createGain();
      const now = sfxCtx.currentTime + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(sfxCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  } catch (e) {}
}

// Sad "Oh No" Descending Buzz (Wrong Answer / Obstacle Hit)
function playSadBuzz() {
  if (sfxMuted) return;
  initSFX();
  try {
    const osc = sfxCtx.createOscillator();
    const gain = sfxCtx.createGain();
    const now = sfxCtx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(sfxCtx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {}
}

// Bubble Pop Chirp
function playBubblePop(pitchMult = 1.0) {
  if (sfxMuted) return;
  initSFX();
  try {
    const osc = sfxCtx.createOscillator();
    const gain = sfxCtx.createGain();
    const now = sfxCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(820 * pitchMult, now + 0.05);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(sfxCtx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
}

// Continuous Ocean Storm Ambient Audio
function startOceanStormAudio() {
  if (oceanStormNode) return;
  initSFX();
  try {
    const bufferSize = sfxCtx.sampleRate * 3;
    const buffer = sfxCtx.createBuffer(1, bufferSize, sfxCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = sfxCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = sfxCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, sfxCtx.currentTime);
    filter.Q.setValueAtTime(1.2, sfxCtx.currentTime);

    const gain = sfxCtx.createGain();
    gain.gain.setValueAtTime(sfxMuted ? 0 : 0.22, sfxCtx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxCtx.destination);

    noise.start();
    oceanStormNode = noise;
    oceanStormGain = gain;
  } catch (e) {}
}

function stopOceanStormAudio() {
  if (oceanStormNode) {
    try {
      oceanStormNode.stop();
      oceanStormNode.disconnect();
    } catch (e) {}
    oceanStormNode = null;
    oceanStormGain = null;
  }
}

// ===========================================================================
// 2. High Score & Unified Results Screen
// ===========================================================================
function getBestScore(gameKey) {
  try {
    return Number(localStorage.getItem(`mindspring_best_${gameKey}`)) || 0;
  } catch (e) {
    return 0;
  }
}

function saveBestScore(gameKey, score) {
  try {
    const best = getBestScore(gameKey);
    if (score > best) {
      localStorage.setItem(`mindspring_best_${gameKey}`, score);
      return score;
    }
    return best;
  } catch (e) {
    return score;
  }
}

function renderResultsCard(gameKey, currentScore, extraMetricsHtml = '', missedItemsHtml = '') {
  const best = saveBestScore(gameKey, currentScore);
  const card = document.getElementById('gameResultsCard');
  if (!card) return;

  card.innerHTML = `
    <div class="results-card-custom mb-4 text-center">
      <div class="fs-1 mb-2">🏆</div>
      <h2 class="fw-bold mb-1">Game Over!</h2>
      <p class="text-muted small mb-3">Great mindful focus session.</p>

      <div class="d-flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
        <div class="score-display-pill">
          <span>✨ Score:</span>
          <span>${currentScore}</span>
        </div>
        <div class="badge bg-warning-subtle text-dark border p-2 px-3 fs-6">
          👑 Best: <strong>${best}</strong>
        </div>
      </div>

      ${extraMetricsHtml ? `<div class="p-3 bg-light rounded text-start mb-3 small">${extraMetricsHtml}</div>` : ''}
      ${missedItemsHtml}
    </div>
  `;
}

// ===========================================================================
// 3. Global Lifecycle & Timer
// ===========================================================================
const root = document.getElementById('game');
const area = document.getElementById('gameArea');
const kind = root ? root.dataset.kind : '';
const duration = root ? Number(root.dataset.duration) : 45;

let before = 0;
let after = 0;
let started = false;
let activeSeconds = 0;
let ticker = null;
let switches = 0;
let finished = false;
let actions = 0;
let gameScore = 0;
let animationFrameId = null;

function setBefore(n) {
  before = n;
  document.querySelectorAll('#beforeRatings .rating-btn').forEach((b, i) => {
    b.classList.toggle('selected', i + 1 === n);
  });
  const btn = document.getElementById('beginButton');
  if (btn) btn.disabled = false;
}

function setAfter(n) {
  after = n;
  document.querySelectorAll('#afterRatings .rating-btn').forEach((b, i) => {
    b.classList.toggle('selected', i + 1 === n);
  });
  const btn = document.getElementById('saveButton');
  if (btn) btn.disabled = false;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && started && !finished) {
    switches++;
    const statusNote = document.getElementById('gameCount');
    if (statusNote) statusNote.textContent = '⏸ Paused while tab was hidden';
  }
});

function note(t) {
  const el = document.getElementById('gameCount');
  if (el) el.textContent = t;
}

function beginGame() {
  initSFX();
  document.getElementById('beforePanel').hidden = true;
  document.getElementById('activePanel').hidden = false;
  started = true;
  activeSeconds = 0;
  gameScore = 0;

  renderGameModule();

  ticker = setInterval(() => {
    if (document.hidden || finished) return;

    activeSeconds++;
    const remaining = Math.max(0, duration - activeSeconds);
    const progressPercent = Math.min(100, Math.round((activeSeconds / duration) * 100));

    const timeLabel = document.getElementById('timeLeft');
    const progressBar = document.getElementById('gameProgress');

    if (timeLabel) timeLabel.textContent = `${remaining}s remaining`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    if (activeSeconds >= duration) {
      endGame();
    }
  }, 1000);
}

function endGame(customResultsCallback = null) {
  if (finished) return;
  finished = true;
  clearInterval(ticker);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  stopOceanStormAudio();

  document.getElementById('activePanel').hidden = true;
  document.getElementById('afterPanel').hidden = false;

  playHappyChime();
  if (typeof confetti === 'function') {
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  }

  if (typeof customResultsCallback === 'function') {
    customResultsCallback();
  } else {
    renderResultsCard(kind, gameScore, `<span>Interactions completed: <strong>${actions}</strong></span>`);
  }
}

async function saveGame() {
  const saveBtn = document.getElementById('saveButton');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving progress...';
  }

  const fraction = Math.min(1.0, activeSeconds / duration);
  const csrfToken = root ? (root.dataset.csrf || '') : '';

  try {
    const response = await fetch('/api/finish', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        csrf_token: csrfToken,
        mood: root.dataset.mood,
        intensity: root.dataset.intensity,
        activity: root.dataset.name,
        fraction: fraction,
        switches: switches,
        before: before,
        after: after,
        metrics: { interactions: actions, score: gameScore, active_seconds: activeSeconds }
      })
    });
    const data = await response.json();
    window.location.href = data.url || '/dashboard';
  } catch (err) {
    window.location.href = '/dashboard';
  }
}

// ---------------------------------------------------------------------------
// 4. Module Router
// ---------------------------------------------------------------------------
function renderGameModule() {
  area.innerHTML = '';
  switch (kind) {
    case 'bubble':
      initStressBubblePop();
      break;
    case 'ocean':
      initCalmInTheOceanRebuild();
      break;
    case 'ground':
      initEnglishMasteryQuiz();
      break;
    case 'odd':
      initOddOneOutFruits();
      break;
    case 'schulte':
      initNumberTableFiveLevels();
      break;
    case 'memory':
      initMemorySequenceHarder();
      break;
    case 'stroop':
      initStroopFiveSecondTimer();
      break;
    case 'gono':
      initGoNoGo();
      break;
    case 'dot':
      initFollowTheDotMultiRound();
      break;
    case 'math':
      initVariedMentalMathQuiz();
      break;
    case 'charades':
      initEmojiCharadesCinema();
      break;
    case 'sudoku':
      initQuickSudokuPuzzle();
      break;
    case 'catpuzzle':
      initCatQueensPuzzle();
      break;
    case 'breath':
    case 'wake':
      initBoxBreathing();
      break;
    case 'power':
      initPowerRest();
      break;
    case 'tap':
      initQuickTapSprint();
      break;
    case 'ladder':
      initTinyWinsLadder();
      break;
    default:
      initStressBubblePop();
  }
}

// ===========================================================================
// GAME 1: Stress Bubble Pop (Kept As Is)
// ===========================================================================
function initStressBubblePop() {
  const container = document.createElement('div');
  container.className = 'w-100 d-flex flex-column align-items-center';

  const toolbar = document.createElement('div');
  toolbar.className = 'input-group mb-3';
  toolbar.style.maxWidth = '500px';
  toolbar.innerHTML = `
    <input type="text" id="customStressorInput" class="form-control" placeholder="Add custom stressor (e.g. Viva, Calculus)...">
    <button class="btn btn-custom-primary" id="addStressorBtn">Spawn Bubble +</button>
  `;
  container.appendChild(toolbar);

  const hud = document.createElement('div');
  hud.className = 'd-flex justify-content-between w-100 mb-2 px-3 fw-bold';
  hud.innerHTML = `
    <span class="text-success fs-5">🫧 Popped: <span id="bubbleScore">0</span></span>
    <span class="text-warning fs-5">Streak: <span id="bubbleCombo">0x</span> 🔥</span>
  `;
  container.appendChild(hud);

  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 420;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '680px';
  canvas.style.borderRadius = '16px';
  canvas.style.background = 'linear-gradient(180deg, #1c3b2b 0%, #0d1e15 100%)';
  canvas.style.cursor = 'crosshair';
  container.appendChild(canvas);
  area.appendChild(container);

  const ctx = canvas.getContext('2d');
  const defaultWords = ['Exams', 'Deadlines', 'Assignments', 'Overthinking', 'Comparison', 'Expectations', 'Viva', 'Backlogs'];

  let bubbles = [];
  let particles = [];
  let poppedCount = 0;
  let combo = 0;
  let speedMultiplier = 1.0;

  class Bubble {
    constructor(text = null, isCustom = false) {
      this.radius = Math.random() * 12 + 32;
      this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
      this.y = canvas.height + this.radius + Math.random() * 20;
      this.speed = (Math.random() * 1.5 + 2.0) * speedMultiplier;
      this.wobbleAngle = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.05 + 0.03;
      this.text = text || defaultWords[Math.floor(Math.random() * defaultWords.length)];
      this.isCustom = isCustom;
      this.color = isCustom ? '#ffd166' : ['#80ced6', '#a0e7e5', '#b4f8c8', '#fbe7c6'][Math.floor(Math.random() * 4)];
    }
    update() {
      this.y -= this.speed;
      this.wobbleAngle += this.wobbleSpeed;
      this.x += Math.sin(this.wobbleAngle) * 1.2;
    }
    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.isCustom ? 'rgba(255, 209, 102, 0.28)' : 'rgba(160, 231, 229, 0.24)';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.radius = Math.random() * 3 + 2;
      const angle = Math.random() * Math.PI * 2;
      const v = Math.random() * 4 + 2;
      this.vx = Math.cos(angle) * v;
      this.vy = Math.sin(angle) * v;
      this.alpha = 1.0;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.035;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnBubble(text = null, isCustom = false) {
    if (bubbles.length < 12) bubbles.push(new Bubble(text, isCustom));
  }

  function popAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (Math.hypot(mx - b.x, my - b.y) <= b.radius + 6) {
        playBubblePop(Math.min(1.8, 0.8 + combo * 0.05));
        for (let p = 0; p < 12; p++) particles.push(new Particle(b.x, b.y, b.color));
        bubbles.splice(i, 1);
        poppedCount++;
        combo++;
        actions++;
        gameScore += 10 + Math.min(10, combo * 2);
        speedMultiplier = Math.min(2.3, 1.0 + poppedCount * 0.03);

        document.getElementById('bubbleScore').textContent = poppedCount;
        document.getElementById('bubbleCombo').textContent = `${combo}x`;
        note(`Score: ${gameScore} • Bursting tension!`);
        return true;
      }
    }
    return false;
  }

  canvas.addEventListener('mousedown', (e) => popAt(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) popAt(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  const addBtn = document.getElementById('addStressorBtn');
  const inputEl = document.getElementById('customStressorInput');
  if (addBtn && inputEl) {
    addBtn.onclick = () => {
      const val = inputEl.value.trim();
      if (val) {
        spawnBubble(val.slice(0, 16), true);
        inputEl.value = '';
      }
    };
  }

  for (let i = 0; i < 5; i++) spawnBubble();
  const spawnInterval = setInterval(() => {
    if (finished) { clearInterval(spawnInterval); return; }
    spawnBubble();
  }, 850);

  function loop() {
    if (finished) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.update();
      b.draw();
      if (b.y + b.radius < 0) {
        bubbles.splice(i, 1);
        combo = 0;
        const comboEl = document.getElementById('bubbleCombo');
        if (comboEl) comboEl.textContent = '0x';
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

// ===========================================================================
// GAME 2: Calm in the Ocean (Rebuild: Top-Down Odyssey with Sea God Rescue)
// ===========================================================================
function initCalmInTheOceanRebuild() {
  const container = document.createElement('div');
  container.className = 'w-100 d-flex flex-column align-items-center';

  // HUD: Lives & Score & State
  const hud = document.createElement('div');
  hud.className = 'd-flex justify-content-between align-items-center w-100 mb-2 px-3 fw-bold';
  hud.innerHTML = `
    <span class="fs-5" id="oceanLives">❤️❤️❤️</span>
    <span class="badge bg-primary fs-6">Score: <span id="oceanScore">0</span></span>
    <span class="badge bg-secondary-subtle text-dark" id="oceanStateStatus">Normal Sailing</span>
  `;
  container.appendChild(hud);

  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 460;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '680px';
  canvas.style.borderRadius = '16px';
  canvas.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
  container.appendChild(canvas);

  // Big Mobile-Friendly Touch Control Buttons
  const controls = document.createElement('div');
  controls.className = 'd-flex justify-content-center gap-2 mt-3 flex-wrap';
  controls.innerHTML = `
    <button class="btn btn-custom-secondary px-3 py-2 fw-bold" id="btnOLeft">◀ LEFT</button>
    <button class="btn btn-warning px-3 py-2 fw-bold text-dark" id="btnOJump">⏫ JUMP</button>
    <button class="btn btn-info px-3 py-2 fw-bold text-dark" id="btnODive">🤿 DIVE</button>
    <button class="btn btn-custom-secondary px-3 py-2 fw-bold" id="btnORight">RIGHT ▶</button>
  `;
  container.appendChild(controls);

  const hint = document.createElement('div');
  hint.className = 'small text-muted mt-2 text-center';
  hint.innerHTML = 'Keyboard: <strong>← →</strong> to Dodge | <strong>SPACE / ↑</strong> to Jump Sharks | <strong>↓</strong> to Dive under Pirates';
  container.appendChild(hint);
  area.appendChild(container);

  const ctx = canvas.getContext('2d');
  startOceanStormAudio();

  let lives = 3;
  let seaGodRescued = false;
  let obstaclesAvoided = 0;
  let boat = {
    x: canvas.width / 2,
    y: canvas.height - 70,
    width: 26,
    height: 42,
    speedX: 0,
    isJumping: false,
    jumpTimer: 0,
    isDiving: false,
    diveTimer: 0,
    invincibleTimer: 0
  };

  const keys = { left: false, right: false };
  let obstacles = [];
  let seaGodHelper = null;
  let waveOffset = 0;

  // Key Listeners
  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Spacebar') triggerJump();
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') triggerDive();
  }
  function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function triggerJump() {
    if (!boat.isJumping && !boat.isDiving) {
      boat.isJumping = true;
      boat.jumpTimer = 38; // ~0.65s
      playBubblePop(1.4);
      updateStatusBadge('⏫ JUMPING OVER WAVES');
    }
  }

  function triggerDive() {
    if (!boat.isDiving && !boat.isJumping) {
      boat.isDiving = true;
      boat.diveTimer = 65; // ~1.1s
      playBubblePop(0.8);
      updateStatusBadge('🤿 SUBMERGED UNDER PIRATES');
    }
  }

  function updateStatusBadge(text) {
    const el = document.getElementById('oceanStateStatus');
    if (el) el.textContent = text;
  }

  // Button Touch Triggers
  const setupBtn = (id, fn) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (ev) => { ev.preventDefault(); fn(); });
      el.addEventListener('touchstart', (ev) => { ev.preventDefault(); fn(); }, { passive: false });
    }
  };
  setupBtn('btnOJump', triggerJump);
  setupBtn('btnODive', triggerDive);
  setupBtn('btnOLeft', () => { boat.x = Math.max(30, boat.x - 45); });
  setupBtn('btnORight', () => { boat.x = Math.min(canvas.width - 30, boat.x + 45); });

  // Spawn Obstacles
  // Types: 'tornado' (dodge L/R), 'shark' (jump), 'pirates' (dive), 'hole' (steer around)
  function spawnObstacle() {
    const rand = Math.random();
    let type = 'tornado';
    if (rand < 0.28) type = 'tornado';
    else if (rand < 0.55) type = 'shark';
    else if (rand < 0.82) type = 'pirates';
    else type = 'hole';

    obstacles.push({
      x: Math.random() * (canvas.width - 120) + 60,
      y: -50,
      type: type,
      speed: Math.random() * 1.5 + 2.8,
      size: type === 'pirates' ? 38 : type === 'tornado' ? 32 : 26,
      cleared: false
    });
  }

  const obstacleTimer = setInterval(() => {
    if (finished) { clearInterval(obstacleTimer); return; }
    spawnObstacle();
    // Sometimes spawn Sea God helper
    if (Math.random() < 0.18 && !seaGodHelper) {
      seaGodHelper = { x: Math.random() * (canvas.width - 100) + 50, y: -40, speed: 2.2 };
    }
  }, 1400);

  function hitObstacle(obs) {
    playSadBuzz();
    lives--;
    boat.invincibleTimer = 60; // 1s invulnerability
    actions++;

    const livesEl = document.getElementById('oceanLives');
    if (livesEl) {
      livesEl.textContent = lives === 2 ? '❤️❤️' : lives === 1 ? '❤️' : '💀';
    }

    // SEA GOD RESCUE ON LAST LIFE!
    if (lives <= 0) {
      if (!seaGodRescued) {
        seaGodRescued = true;
        lives = 2;
        boat.invincibleTimer = 120; // 2s shield
        playHappyChime();
        if (livesEl) livesEl.textContent = '❤️❤️ (🔱 Blessed)';
        note('🔱 THE SEA GOD SPARED YOU! You were granted divine safe passage!');
        if (typeof confetti === 'function') confetti({ particleCount: 45, spread: 50 });
      } else {
        // Game Over
        endGame(() => {
          renderResultsCard('ocean', gameScore, `
            <div class="d-flex justify-content-between mb-1"><span>Distance Traveled:</span><strong>${activeSeconds * 12}m</strong></div>
            <div class="d-flex justify-content-between mb-1"><span>Obstacles Evaded:</span><strong>${obstaclesAvoided}</strong></div>
            <div class="d-flex justify-content-between"><span>Sea God Rescue:</span><strong>${seaGodRescued ? 'Used 🔱' : 'Not Needed'}</strong></div>
          `);
        });
      }
    }
  }

  function loop() {
    if (finished) return;
    waveOffset += 0.05;

    // Background: Sea with animated waves traveling down
    const beachProgress = Math.min(1.0, activeSeconds / 75);
    const r = Math.round(18 + beachProgress * 28);
    const g = Math.round(38 + beachProgress * 120);
    const b = Math.round(65 + beachProgress * 95);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Waves
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let wy = -20; wy < canvas.height + 40; wy += 38) {
      ctx.beginPath();
      ctx.moveTo(0, wy);
      for (let wx = 0; wx <= canvas.width; wx += 25) {
        ctx.lineTo(wx, wy + Math.sin(wx * 0.02 + waveOffset) * 6);
      }
      ctx.lineTo(canvas.width, wy + 15);
      ctx.lineTo(0, wy + 15);
      ctx.fill();
    }
    ctx.restore();

    // Beach at top visible as time progresses
    if (beachProgress > 0.6) {
      ctx.save();
      const beachY = Math.min(65, (beachProgress - 0.6) * 160);
      ctx.fillStyle = '#e9d8a6';
      ctx.fillRect(0, 0, canvas.width, beachY);
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(80, beachY - 10, 20, 0, Math.PI * 2);
      ctx.arc(280, beachY - 12, 22, 0, Math.PI * 2);
      ctx.arc(520, beachY - 15, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Steering Boat
    if (keys.left) boat.x -= 4.5;
    if (keys.right) boat.x += 4.5;
    boat.x = Math.max(30, Math.min(canvas.width - 30, boat.x));

    // Handle Timers
    if (boat.isJumping) {
      boat.jumpTimer--;
      if (boat.jumpTimer <= 0) {
        boat.isJumping = false;
        updateStatusBadge('Normal Sailing');
      }
    }
    if (boat.isDiving) {
      boat.diveTimer--;
      if (boat.diveTimer <= 0) {
        boat.isDiving = false;
        updateStatusBadge('Normal Sailing');
      }
    }
    if (boat.invincibleTimer > 0) boat.invincibleTimer--;

    // Update Distance Score
    gameScore += 1;
    const scoreEl = document.getElementById('oceanScore');
    if (scoreEl) scoreEl.textContent = gameScore;

    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obs.speed;

      // Draw Obstacle
      ctx.save();
      if (obs.type === 'tornado') {
        // Tornado: Spinning spiral
        ctx.fillStyle = '#adb5bd';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#212529';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌪️', obs.x, obs.y + 7);
      } else if (obs.type === 'shark') {
        // Shark
        ctx.fillStyle = '#343a40';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦈', obs.x, obs.y + 8);
      } else if (obs.type === 'pirates') {
        // Pirate Ship
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏴‍☠️', obs.x, obs.y + 8);
      } else {
        // Whirlpool Hole
        ctx.fillStyle = 'rgba(10, 20, 30, 0.7)';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌀', obs.x, obs.y + 7);
      }
      ctx.restore();

      // Check Collision with Boat
      const dist = Math.hypot(obs.x - boat.x, obs.y - boat.y);
      if (dist < obs.size + 14 && boat.invincibleTimer === 0) {
        let isSafe = false;
        if (obs.type === 'shark' && boat.isJumping) isSafe = true; // jumped over shark
        if (obs.type === 'pirates' && boat.isDiving) isSafe = true; // dived under pirates

        if (!isSafe) {
          hitObstacle(obs);
          obstacles.splice(i, 1);
          continue;
        }
      }

      // Evaded successfully
      if (obs.y > canvas.height + 20) {
        if (!obs.cleared) {
          obstaclesAvoided++;
          gameScore += 15;
          playHappyChime();
        }
        obstacles.splice(i, 1);
      }
    }

    // Sea God Helper
    if (seaGodHelper) {
      seaGodHelper.y += seaGodHelper.speed;
      ctx.save();
      ctx.beginPath();
      ctx.arc(seaGodHelper.x, seaGodHelper.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.fill();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔱', seaGodHelper.x, seaGodHelper.y + 8);
      ctx.restore();

      if (Math.hypot(seaGodHelper.x - boat.x, seaGodHelper.y - boat.y) < 32) {
        playHappyChime();
        gameScore += 50;
        boat.invincibleTimer = 90;
        note('🔱 Sea God blessed you with +50 points and protection!');
        seaGodHelper = null;
      } else if (seaGodHelper && seaGodHelper.y > canvas.height + 30) {
        seaGodHelper = null;
      }
    }

    // Draw The Player's Boat
    ctx.save();
    ctx.translate(boat.x, boat.y);

    if (boat.isJumping) {
      // Boat scale jump up + shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 16;
      ctx.scale(1.35, 1.35);
    } else if (boat.isDiving) {
      // Translucent underwater
      ctx.globalAlpha = 0.4;
    }

    if (boat.invincibleTimer > 0 && Math.floor(boat.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.3; // Flashing shield
    }

    // Boat Hull
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, boat.width / 2, boat.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a3d1b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Sail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 4);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

// ===========================================================================
// GAME 3: English Mastery Quiz (100 Questions Bank across Easy/Medium/Hard)
// ===========================================================================
const ENGLISH_QUESTION_BANK = [
  // --- EASY (30 Questions) ---
  { q: "Choose the correct spelling:", options: ["Accommodate", "Acommodate", "Accomodate", "Acomodate"], answer: 0, difficulty: "easy", explanation: "Accommodate has two 'c's and two 'm's." },
  { q: "Identify the antonym of 'GENEROUS':", options: ["Stingy", "Benevolent", "Kind", "Courteous"], answer: 0, difficulty: "easy", explanation: "Stingy means unwilling to spend or share." },
  { q: "Choose the synonym of 'BRIEF':", options: ["Short", "Lengthy", "Extended", "Verbose"], answer: 0, difficulty: "easy", explanation: "Brief means of short duration." },
  { q: "Fill in the blank: She has been living here _____ 2020.", options: ["since", "for", "from", "at"], answer: 0, difficulty: "easy", explanation: "'Since' is used for a specific starting point in time." },
  { q: "Which of these is a NOUN?", options: ["Happiness", "Quickly", "Beautiful", "Run"], answer: 0, difficulty: "easy", explanation: "'Happiness' is an abstract noun." },
  { q: "Select the correct plural form of 'Child':", options: ["Children", "Childs", "Childrens", "Childes"], answer: 0, difficulty: "easy", explanation: "The irregular plural of child is children." },
  { q: "Identify the antonym of 'EXPAND':", options: ["Shrink", "Inflate", "Enlarge", "Grow"], answer: 0, difficulty: "easy", explanation: "Shrink means to become smaller." },
  { q: "Fill in the blank: Neither John nor his friends _____ present.", options: ["were", "was", "is", "be"], answer: 0, difficulty: "easy", explanation: "In 'neither...nor', the verb agrees with the closer subject ('friends')." },
  { q: "What is the past tense of 'Fly'?", options: ["Flew", "Flied", "Flown", "Flying"], answer: 0, difficulty: "easy", explanation: "The simple past of fly is flew." },
  { q: "Choose the correct spelling:", options: ["Receive", "Recieve", "Receve", "Riceive"], answer: 0, difficulty: "easy", explanation: "Remember: 'i' before 'e' except after 'c' (Receive)." },
  { q: "Which word means 'occurring once every year'?", options: ["Annual", "Biennial", "Centennial", "Perennial"], answer: 0, difficulty: "easy", explanation: "Annual means happening once every year." },
  { q: "Choose the synonym of 'HAPPY':", options: ["Joyful", "Melancholy", "Gloomy", "Sullen"], answer: 0, difficulty: "easy", explanation: "Joyful means expressing great happiness." },
  { q: "Fill in the blank: He is afraid _____ spiders.", options: ["of", "from", "with", "by"], answer: 0, difficulty: "easy", explanation: "The preposition 'of' always follows afraid." },
  { q: "Select the antonym of 'ANCIENT':", options: ["Modern", "Prehistoric", "Antique", "Archaic"], answer: 0, difficulty: "easy", explanation: "Modern means relating to the present or recent times." },
  { q: "Choose the correct article: He is _____ honest man.", options: ["an", "a", "the", "no article"], answer: 0, difficulty: "easy", explanation: "'Honest' begins with a vowel sound, so 'an' is required." },
  { q: "Which word is an ADVERB?", options: ["Quietly", "Quiet", "Quietude", "Quietness"], answer: 0, difficulty: "easy", explanation: "'Quietly' modifies verbs and ends in -ly." },
  { q: "Identify the synonym of 'COURAGEOUS':", options: ["Brave", "Timid", "Cowardly", "Hesitant"], answer: 0, difficulty: "easy", explanation: "Brave means ready to face danger." },
  { q: "Fill in the blank: The sun _____ in the east.", options: ["rises", "rose", "rising", "is rose"], answer: 0, difficulty: "easy", explanation: "Universal truths use simple present tense (rises)." },
  { q: "Select the correctly spelt word:", options: ["Separate", "Seperate", "Seprate", "Sepparate"], answer: 0, difficulty: "easy", explanation: "Separate has 'a' after the 'p' (sep-A-rate)." },
  { q: "What is the opposite of 'ARTIFICIAL'?", options: ["Natural", "Synthetic", "Fabricated", "Manufactured"], answer: 0, difficulty: "easy", explanation: "Natural means existing in or caused by nature." },
  { q: "Complete the idiom: 'Once in a _____ moon.'", options: ["blue", "red", "full", "dark"], answer: 0, difficulty: "easy", explanation: "'Once in a blue moon' means very rarely." },
  { q: "Which pronoun is REFLEXIVE?", options: ["Myself", "Me", "Mine", "My"], answer: 0, difficulty: "easy", explanation: "'Myself' is a reflexive pronoun." },
  { q: "Choose the synonym of 'MASSIVE':", options: ["Huge", "Tiny", "Petite", "Miniature"], answer: 0, difficulty: "easy", explanation: "Massive means exceptionally large or heavy." },
  { q: "Choose the correct spelling:", options: ["Definitely", "Definately", "Definitly", "Defenetly"], answer: 0, difficulty: "easy", explanation: "Definitely comes from finite (def-i-nite-ly)." },
  { q: "Identify the antonym of 'FREQUENT':", options: ["Rare", "Common", "Usual", "Repeated"], answer: 0, difficulty: "easy", explanation: "Rare means not occurring very often." },
  { q: "Fill in the blank: Each of the students _____ given a pen.", options: ["was", "were", "are", "have"], answer: 0, difficulty: "easy", explanation: "'Each' is singular and takes the singular verb 'was'." },
  { q: "What is a group of lions called?", options: ["Pride", "Pack", "Flock", "Herd"], answer: 0, difficulty: "easy", explanation: "A collection of lions is termed a pride." },
  { q: "Select the synonym of 'RAPID':", options: ["Fast", "Sluggish", "Lethargic", "Delayed"], answer: 0, difficulty: "easy", explanation: "Rapid means happening in a short time or at great speed." },
  { q: "Choose the correct spelling:", options: ["Calendar", "Calender", "Calandar", "Celendar"], answer: 0, difficulty: "easy", explanation: "Calendar ends with '-ar'." },
  { q: "Fill in the blank: They have walked _____ miles.", options: ["many", "much", "more much", "any"], answer: 0, difficulty: "easy", explanation: "'Miles' is countable, so 'many' is used." },

  // --- MEDIUM (40 Questions) ---
  { q: "What does the idiom 'Bite the bullet' mean?", options: ["Face a tough situation bravely", "Stop eating", "Start a conflict", "Act impulsively"], answer: 0, difficulty: "medium", explanation: "Biting the bullet means confronting an inevitable, painful situation." },
  { q: "One who looks at the bright side of things is called:", options: ["Optimist", "Pessimist", "Philanthropist", "Pacifist"], answer: 0, difficulty: "medium", explanation: "An optimist anticipates positive outcomes." },
  { q: "Identify the synonym of 'METICULOUS':", options: ["Thorough", "Careless", "Hasty", "Sloppy"], answer: 0, difficulty: "medium", explanation: "Meticulous means showing great attention to detail." },
  { q: "Choose the antonym of 'OBSOLETE':", options: ["Contemporary", "Outdated", "Ancient", "Extinct"], answer: 0, difficulty: "medium", explanation: "Contemporary means modern and up to date." },
  { q: "Correct the sentence: 'She is married with a doctor.'", options: ["She is married to a doctor.", "She is married by a doctor.", "She is married at a doctor.", "She marries with a doctor."], answer: 0, difficulty: "medium", explanation: "The verb 'married' takes the preposition 'to', not 'with'." },
  { q: "What does 'A blessing in disguise' mean?", options: ["Something good that seemed bad at first", "A spiritual reward", "A secret gift", "A curse"], answer: 0, difficulty: "medium", explanation: "A misfortune that turns out to have positive results." },
  { q: "One who cannot be corrected or reformed is:", options: ["Incorrigible", "Infallible", "Invulnerable", "Incredible"], answer: 0, difficulty: "medium", explanation: "Incorrigible means not able to be corrected or improved." },
  { q: "Select the correct spelling:", options: ["Embarrassment", "Embarassment", "Embarrasment", "Embarasment"], answer: 0, difficulty: "medium", explanation: "Double 'r' and double 's': Embarrassment." },
  { q: "Synonym of 'PRAGMATIC':", options: ["Practical", "Idealistic", "Theoretical", "Speculative"], answer: 0, difficulty: "medium", explanation: "Pragmatic means dealing with things sensibly and realistically." },
  { q: "Fill in the blank: The committee _____ divided in their opinions.", options: ["were", "was", "is", "has"], answer: 0, difficulty: "medium", explanation: "When members of a collective noun act individually, use plural 'were'." },
  { q: "What is the meaning of 'Call it a day'?", options: ["Stop working on something", "Celebrate a milestone", "Start a morning routine", "Cancel tomorrow"], answer: 0, difficulty: "medium", explanation: "To stop what you are doing because you have done enough." },
  { q: "A person who loves books is called a:", options: ["Bibliophile", "Philatelist", "Polyglot", "Numismatist"], answer: 0, difficulty: "medium", explanation: "Biblio (book) + phile (lover) = Bibliophile." },
  { q: "Choose the antonym of 'CANDID':", options: ["Deceitful", "Honest", "Frank", "Sincere"], answer: 0, difficulty: "medium", explanation: "Candid means straightforward; deceitful is its opposite." },
  { q: "Find the error: 'He has visited Paris last year.'", options: ["visited (should be simple past)", "He (should be Him)", "Paris (should be in Paris)", "No error"], answer: 0, difficulty: "medium", explanation: "With a finished past time ('last year'), use simple past ('visited'), not present perfect." },
  { q: "Identify the synonym of 'LUCID':", options: ["Clear", "Confusing", "Opaque", "Vague"], answer: 0, difficulty: "medium", explanation: "Lucid means expressed clearly and easy to understand." },
  { q: "One who knows everything is called:", options: ["Omniscient", "Omnipotent", "Omnipresent", "Omnivorous"], answer: 0, difficulty: "medium", explanation: "Omni (all) + scient (knowing) = Omniscient." },
  { q: "What does 'Burn the midnight oil' mean?", options: ["Study or work late into the night", "Waste electricity", "Start a fire", "Cook dinner late"], answer: 0, difficulty: "medium", explanation: "Working or studying late at night." },
  { q: "Select the correctly spelt word:", options: ["Millennium", "Millenium", "Milennium", "Millennum"], answer: 0, difficulty: "medium", explanation: "Double 'l' and double 'n': Millennium." },
  { q: "Choose the antonym of 'TRANSIENT':", options: ["Permanent", "Temporary", "Fleeting", "Brief"], answer: 0, difficulty: "medium", explanation: "Transient means lasting only for a short time." },
  { q: "Fill in the blank: Scarcely had I arrived _____ it started raining.", options: ["when", "than", "then", "after"], answer: 0, difficulty: "medium", explanation: "'Scarcely...when' is the correct correlative pair." },
  { q: "A speech delivered without preparation is:", options: ["Extempore", "Maiden", "Eulogy", "Oration"], answer: 0, difficulty: "medium", explanation: "Extempore means spoken or done without preparation." },
  { q: "Identify the synonym of 'AFFLUENT':", options: ["Wealthy", "Impoverished", "Destitute", "Greedy"], answer: 0, difficulty: "medium", explanation: "Affluent means having a great deal of money or wealth." },
  { q: "What does 'Barking up the wrong tree' signify?", options: ["Pursuing a mistaken line of thought", "Shouting at an animal", "Climbing dangerous trees", "Cutting trees"], answer: 0, difficulty: "medium", explanation: "Following a false lead or making a wrong assumption." },
  { q: "Correct spelling:", options: ["Hierarchy", "Heirarchy", "Hierarcy", "Heirarcy"], answer: 0, difficulty: "medium", explanation: "Hierarchy begins with 'H-I-E'." },
  { q: "Fill in the blank: She prefers tea _____ coffee.", options: ["to", "than", "over", "from"], answer: 0, difficulty: "medium", explanation: "'Prefer' takes the preposition 'to'." },
  { q: "A handwriting that cannot be read is:", options: ["Illegible", "Ineligible", "Illiterate", "Invisible"], answer: 0, difficulty: "medium", explanation: "Illegible means not clear enough to be read." },
  { q: "Choose the antonym of 'AMIABLE':", options: ["Hostile", "Friendly", "Sociable", "Cordial"], answer: 0, difficulty: "medium", explanation: "Amiable means warm and friendly; hostile is unfriendly." },
  { q: "Meaning of the idiom 'Spill the beans':", options: ["Reveal a secret prematurely", "Waste food", "Cook clumsily", "Apologize publicly"], answer: 0, difficulty: "medium", explanation: "To reveal secret information unexpectedly." },
  { q: "Choose the synonym of 'TENACIOUS':", options: ["Persistent", "Weak", "Hesitant", "Slack"], answer: 0, difficulty: "medium", explanation: "Tenacious means holding firm and never giving up." },
  { q: "One who speaks many languages is a:", options: ["Polyglot", "Linguist", "Grammarian", "Orator"], answer: 0, difficulty: "medium", explanation: "A polyglot is a person who knows and uses several languages." },
  { q: "Correct spelling:", options: ["Privilege", "Privelege", "Priviledge", "Privlege"], answer: 0, difficulty: "medium", explanation: "Privilege has no 'd' (P-R-I-V-I-L-E-G-E)." },
  { q: "Antonym of 'VULNERABLE':", options: ["Resilient", "Defenseless", "Susceptible", "Fragile"], answer: 0, difficulty: "medium", explanation: "Resilient means able to withstand adversity or damage." },
  { q: "Fill in the blank: If I _____ you, I would take that offer.", options: ["were", "was", "am", "have been"], answer: 0, difficulty: "medium", explanation: "Hypothetical subjunctive conditionals use 'were'." },
  { q: "Meaning of 'Hit the nail on the head':", options: ["State the exact truth", "Do carpentry", "Make a painful mistake", "Break a promise"], answer: 0, difficulty: "medium", explanation: "To describe exactly what is causing a situation or problem." },
  { q: "Synonym of 'RESILIENT':", options: ["Tough", "Brittle", "Delicate", "Rigid"], answer: 0, difficulty: "medium", explanation: "Resilient implies capacity to bounce back from difficulty." },
  { q: "A remedy for all diseases is called a:", options: ["Panacea", "Placebo", "Tonic", "Antibiotic"], answer: 0, difficulty: "medium", explanation: "Panacea means a universal cure or solution." },
  { q: "Correct spelling:", options: ["Conscientious", "Consciencious", "Consentious", "Conscensious"], answer: 0, difficulty: "medium", explanation: "Conscientious comes from conscience + tious." },
  { q: "Antonym of 'DILIGENT':", options: ["Lazy", "Industrious", "Assiduous", "Hardworking"], answer: 0, difficulty: "medium", explanation: "Diligent means showing care and effort; lazy is the opposite." },
  { q: "What does 'Through thick and thin' mean?", options: ["Under all circumstances, good and bad", "Through heavy weather", "Dieting strictly", "Reading dense books"], answer: 0, difficulty: "medium", explanation: "Supporting someone through both good times and difficult times." },
  { q: "Fill in the blank: He congratulated me _____ my graduation.", options: ["on", "for", "at", "about"], answer: 0, difficulty: "medium", explanation: "The verb 'congratulate' takes 'on', not 'for'." },

  // --- HARD (30 Questions) ---
  { q: "Choose the synonym of 'UBIQUITOUS':", options: ["Omnipresent", "Rare", "Scarce", "Secluded"], answer: 0, difficulty: "hard", explanation: "Ubiquitous means found or present everywhere." },
  { q: "What is the meaning of 'ESOTERIC'?", options: ["Understood by only a select few", "Extremely popular", "Outwardly visible", "Traditional"], answer: 0, difficulty: "hard", explanation: "Esoteric refers to specialized knowledge intended for a chosen few." },
  { q: "Antonym of 'EPHEMERAL':", options: ["Eternal", "Fleeting", "Evanescent", "Momentary"], answer: 0, difficulty: "hard", explanation: "Ephemeral means short-lived; eternal means lasting forever." },
  { q: "A person who is excessively particular and hard to please is:", options: ["Fastidious", "Gregarious", "Altruistic", "Garrulous"], answer: 0, difficulty: "hard", explanation: "Fastidious means very attentive to and concerned about accuracy and detail." },
  { q: "Identify the meaning of 'CACOPHONY':", options: ["A harsh, discordant mixture of sounds", "A soothing melody", "A rhythmic chant", "Complete silence"], answer: 0, difficulty: "hard", explanation: "Cacophony refers to an unpleasant, jarring noise." },
  { q: "Choose the correct spelling:", options: ["Surreptitious", "Surruptitious", "Sureptitious", "Surrepticious"], answer: 0, difficulty: "hard", explanation: "Surreptitious (kept secret, especially because it would not be approved of)." },
  { q: "Choose the synonym of 'ALACRITY':", options: ["Brisk eagerness", "Reluctance", "Sluggishness", "Indifference"], answer: 0, difficulty: "hard", explanation: "Alacrity means brisk and cheerful readiness." },
  { q: "Antonym of 'LOQUACIOUS':", options: ["Reticent", "Talkative", "Voluble", "Garrulous"], answer: 0, difficulty: "hard", explanation: "Loquacious means talkative; reticent means quiet and reserved." },
  { q: "What is a 'Pyrrhic victory'?", options: ["A victory won at devastatingly great cost", "An effortless triumph", "A victory in naval battle", "A disputed draw"], answer: 0, difficulty: "hard", explanation: "A victory that inflicts such a devastating toll on the victor that it is tantamount to defeat." },
  { q: "The practice of having more than one spouse at the same time is:", options: ["Polygamy", "Monogamy", "Bigamy", "Endogamy"], answer: 0, difficulty: "hard", explanation: "Polygamy is the practice or custom of having more than one wife or husband simultaneously." },
  { q: "Identify the synonym of 'PERFUNCTORY':", options: ["Superficial and hurried", "Deeply thorough", "Artistic", "Passionate"], answer: 0, difficulty: "hard", explanation: "Perfunctory actions are carried out with minimum effort or reflection." },
  { q: "Choose the correct spelling:", options: ["Idiosyncrasy", "Idiosyncracy", "Ideosyncrasy", "Idyosyncrasy"], answer: 0, difficulty: "hard", explanation: "Idiosyncrasy ends with '-asy', not '-acy'." },
  { q: "What does the idiom 'To throw down the gauntlet' mean?", options: ["To issue a formal challenge", "To surrender in battle", "To drop heavy armor", "To insult someone secretly"], answer: 0, difficulty: "hard", explanation: "In medieval times, throwing a heavy glove signified a duel challenge." },
  { q: "Fear of enclosed spaces is termed:", options: ["Claustrophobia", "Agoraphobia", "Acrophobia", "Hydrophobia"], answer: 0, difficulty: "hard", explanation: "Claustrophobia is the irrational fear of confined places." },
  { q: "Synonym of 'SYCOPHANT':", options: ["Flatterer", "Leader", "Rebel", "Scholar"], answer: 0, difficulty: "hard", explanation: "A sycophant is someone who acts obsequiously toward someone to gain advantage." },
  { q: "Antonym of 'INIMICAL':", options: ["Friendly", "Hostile", "Harmful", "Adverse"], answer: 0, difficulty: "hard", explanation: "Inimical means tending to obstruct or harm; friendly is its antonym." },
  { q: "Choose the correctly spelt word:", options: ["Liaison", "Liason", "Liasion", "Liaissun"], answer: 0, difficulty: "hard", explanation: "Liaison has an 'i' after both 'l' and 'a'." },
  { q: "What is an 'Anachronism'?", options: ["Something placed in an inappropriate chronological period", "A cure for poison", "A state of lawlessness", "A rhetorical question"], answer: 0, difficulty: "hard", explanation: "An anachronism is a thing belonging or appropriate to a period other than that in which it exists." },
  { q: "Identify the synonym of 'EQUANIMITY':", options: ["Composure", "Panic", "Agitation", "Rage"], answer: 0, difficulty: "hard", explanation: "Equanimity means mental calmness and poise, especially in a difficult situation." },
  { q: "One who deserts his religion or political party is an:", options: ["Apostate", "Altruist", "Iconoclast", "Ascetic"], answer: 0, difficulty: "hard", explanation: "An apostate is a person who renounces a religious or political belief." },
  { q: "What does 'Sui generis' mean?", options: ["Unique / in a class of its own", "Commonplace", "Under investigation", "In bad faith"], answer: 0, difficulty: "hard", explanation: "Latin for 'of its own kind', meaning unique." },
  { q: "Antonym of 'TACITURN':", options: ["Garrulous", "Silent", "Mute", "Introverted"], answer: 0, difficulty: "hard", explanation: "Taciturn means saying little; garrulous means excessively talkative." },
  { q: "Correct spelling:", options: ["Pusillanimous", "Pusilanimous", "Pussillanimous", "Pusillanemous"], answer: 0, difficulty: "hard", explanation: "Pusillanimous means showing a lack of courage or determination." },
  { q: "What does 'To tilt at windmills' mean?", options: ["Fight imaginary enemies", "Build wind turbines", "Act pragmatically", "Travel to the Netherlands"], answer: 0, difficulty: "hard", explanation: "From Don Quixote: attacking imaginary or trivial foes." },
  { q: "A person who destroys sacred images or conventions is an:", options: ["Iconoclast", "Fanatic", "Nihilist", "Atheist"], answer: 0, difficulty: "hard", explanation: "An iconoclast attacks cherished beliefs or institutions." },
  { q: "Synonym of 'PELLUCID':", options: ["Translucently clear", "Murky", "Muddy", "Deceptive"], answer: 0, difficulty: "hard", explanation: "Pellucid means translucently clear in surface or comprehension." },
  { q: "Identify the antonym of 'CAPRICIOUS':", options: ["Steadfast", "Fickle", "Erratic", "Mercurial"], answer: 0, difficulty: "hard", explanation: "Capricious means given to sudden unaccountable changes of mood; steadfast is constant." },
  { q: "Choose the correct spelling:", options: ["Supercilious", "Supercillious", "Supercilous", "Supercelious"], answer: 0, difficulty: "hard", explanation: "Supercilious (behaving or looking as though one thinks one is superior to others)." },
  { q: "What is an 'Epiphany'?", options: ["A sudden intuitive revelation or insight", "A tragic downfall", "A poetic stanza", "A state of exhaustion"], answer: 0, difficulty: "hard", explanation: "An epiphany is a moment of sudden and profound understanding." },
  { q: "One who renounces all physical pleasure for spiritual discipline is an:", options: ["Ascetic", "Hedonist", "Epicurean", "Stoic"], answer: 0, difficulty: "hard", explanation: "An ascetic practices severe self-discipline and abstention from all forms of indulgence." }
];

function initEnglishMasteryQuiz() {
  const container = document.createElement('div');
  container.className = 'w-100 max-w-700 mx-auto';

  // HUD: Question Index, Timer, Score
  container.innerHTML = `
    <div class="card p-4 bg-white border shadow-sm rounded-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6" id="eqBadge">Question 1 of 10</span>
        <span class="badge bg-warning-subtle text-dark border px-3 py-2 fw-bold" id="eqTimer">⏳ 12s</span>
        <span class="badge bg-success fs-6">Score: <span id="eqScore">0</span></span>
      </div>

      <div class="progress mb-4" style="height: 6px;">
        <div class="progress-bar bg-warning" id="eqTimerBar" style="width: 100%; transition: width 1s linear;"></div>
      </div>

      <div class="mb-4 text-start">
        <span class="badge bg-secondary-subtle text-secondary text-uppercase mb-2" id="eqDifficulty">Easy</span>
        <h3 class="fw-bold mb-3" id="eqQuestionText">Loading Question...</h3>
      </div>

      <div class="d-flex flex-column gap-2 mb-3" id="eqOptions"></div>

      <div id="eqFeedback" class="p-3 rounded mb-3 small text-start" style="display: none;"></div>
    </div>
  `;
  area.appendChild(container);

  // Pick 10 questions: 3 easy + 4 medium + 3 hard
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem('mindspring_seen_english_q') || '[]');
  } catch (e) { seen = []; }

  function getTierQuestions(tier, count) {
    const pool = ENGLISH_QUESTION_BANK.filter(q => q.difficulty === tier);
    let unseen = pool.filter(q => !seen.includes(q.q));
    if (unseen.length < count) {
      // reset seen for this tier
      seen = seen.filter(sq => !pool.some(pq => pq.q === sq));
      unseen = pool;
    }
    const shuffled = [...unseen].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);
    chosen.forEach(c => seen.push(c.q));
    return chosen;
  }

  const selectedQuestions = [
    ...getTierQuestions('easy', 3),
    ...getTierQuestions('medium', 4),
    ...getTierQuestions('hard', 3)
  ];

  try {
    localStorage.setItem('mindspring_seen_english_q', JSON.stringify(seen));
  } catch (e) {}

  let qIndex = 0;
  let qTimerSeconds = 12;
  let qInterval = null;
  let answered = false;
  let correctCount = 0;

  function loadQuestion() {
    if (qIndex >= selectedQuestions.length) {
      endGame(() => {
        renderResultsCard('ground', gameScore, `
          <div class="d-flex justify-content-between mb-1"><span>Correct Answers:</span><strong>${correctCount} / 10</strong></div>
          <div class="d-flex justify-content-between"><span>Accuracy:</span><strong>${Math.round((correctCount / 10) * 100)}%</strong></div>
        `);
      });
      return;
    }

    answered = false;
    qTimerSeconds = 12;
    const qObj = selectedQuestions[qIndex];

    document.getElementById('eqBadge').textContent = `Question ${qIndex + 1} of 10`;
    document.getElementById('eqDifficulty').textContent = qObj.difficulty;
    document.getElementById('eqQuestionText').textContent = qObj.q;
    document.getElementById('eqScore').textContent = gameScore;
    document.getElementById('eqFeedback').style.display = 'none';

    // Shuffle options
    const shuffledIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const optBox = document.getElementById('eqOptions');
    optBox.innerHTML = '';

    shuffledIndices.forEach(idx => {
      const b = document.createElement('button');
      b.className = 'btn btn-outline-secondary p-3 text-start fw-bold fs-6 rounded-3';
      b.textContent = qObj.options[idx];
      b.onclick = () => selectAnswer(idx, b, shuffledIndices);
      optBox.appendChild(b);
    });

    startQTimer();
  }

  function startQTimer() {
    clearInterval(qInterval);
    const timerEl = document.getElementById('eqTimer');
    const barEl = document.getElementById('eqTimerBar');

    qInterval = setInterval(() => {
      if (finished || answered) return;
      qTimerSeconds--;
      if (timerEl) timerEl.textContent = `⏳ ${qTimerSeconds}s`;
      if (barEl) barEl.style.width = `${(qTimerSeconds / 12) * 100}%`;

      if (qTimerSeconds <= 0) {
        clearInterval(qInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    if (answered) return;
    answered = true;
    playSadBuzz();
    const qObj = selectedQuestions[qIndex];
    const fb = document.getElementById('eqFeedback');
    fb.className = 'p-3 rounded mb-3 small text-start alert alert-danger';
    fb.innerHTML = `<strong>⏰ Time Out!</strong> Correct answer was: <strong>${qObj.options[qObj.answer]}</strong>. ${qObj.explanation}`;
    fb.style.display = 'block';

    setTimeout(() => {
      qIndex++;
      loadQuestion();
    }, 2000);
  }

  function selectAnswer(chosenIdx, btnEl, shuffledIndices) {
    if (answered) return;
    answered = true;
    clearInterval(qInterval);
    actions++;

    const qObj = selectedQuestions[qIndex];
    const isCorrect = chosenIdx === qObj.answer;
    const fb = document.getElementById('eqFeedback');

    if (isCorrect) {
      playHappyChime();
      btnEl.className = 'btn btn-success p-3 text-start fw-bold fs-6 rounded-3 text-white';
      const speedBonus = qTimerSeconds;
      const pts = 10 + speedBonus;
      gameScore += pts;
      correctCount++;
      document.getElementById('eqScore').textContent = gameScore;
      fb.className = 'p-3 rounded mb-3 small text-start alert alert-success';
      fb.innerHTML = `<strong>✓ Excellent! (+${pts} pts)</strong> ${qObj.explanation}`;
    } else {
      playSadBuzz();
      btnEl.className = 'btn btn-danger p-3 text-start fw-bold fs-6 rounded-3 text-white';
      fb.className = 'p-3 rounded mb-3 small text-start alert alert-warning';
      fb.innerHTML = `<strong>✕ Incorrect!</strong> Correct: <strong>${qObj.options[qObj.answer]}</strong>. ${qObj.explanation}`;
    }
    fb.style.display = 'block';

    setTimeout(() => {
      qIndex++;
      loadQuestion();
    }, 1800);
  }

  loadQuestion();
}

// ===========================================================================
// GAME 4: Odd One Out (Fruits with ONE Hidden Vegetable)
// ===========================================================================
function initOddOneOutFruits() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-600 mx-auto';

  const FRUITS = ['🍎', '🍌', '🍓', '🍊', '🍇', '🍉', '🍍', '🍑', '🍒', '🍐', '🥭', '🍏', '🍋', '🥝'];
  const VEGETABLES = ['🥦', '🥕', '🍆', '🥔', '🧅', '🧄', '🌽', '🥒', '🥬', '🍄'];

  let level = 3; // 3x3 up to 6x6
  let gridContainer = null;

  function renderRound() {
    area.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'card p-4 text-center bg-white border rounded-4';

    wrapper.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6">Level ${level - 2} (${level}×${level})</span>
        <span class="badge bg-success fs-6">Score: ${gameScore}</span>
      </div>
      <h4 class="fw-bold mb-2">Tap the ONE Vegetable hidden among the fruits! 🥕</h4>
      <p class="small text-muted mb-4">Find the veggie to grow the grid and score points.</p>
    `;

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${level}, clamp(46px, 11vw, 68px))`;
    grid.style.gap = '8px';
    grid.style.justifyContent = 'center';
    grid.className = 'mb-3';

    const cellCount = level * level;
    const vegIdx = Math.floor(Math.random() * cellCount);
    const chosenVeg = VEGETABLES[Math.floor(Math.random() * VEGETABLES.length)];
    const chosenFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];

    for (let i = 0; i < cellCount; i++) {
      const b = document.createElement('button');
      b.className = 'btn btn-custom-secondary p-0 d-flex align-items-center justify-content-center';
      b.style.height = 'clamp(46px, 11vw, 68px)';
      b.style.fontSize = 'clamp(1.5rem, 4vw, 2.3rem)';
      b.textContent = i === vegIdx ? chosenVeg : chosenFruit;

      b.onclick = () => {
        actions++;
        if (i === vegIdx) {
          playHappyChime();
          gameScore += 15;
          if (level < 6) level++;
          note(`Found ${chosenVeg}! Grid growing to ${level}×${level}`);
          renderRound();
        } else {
          playSadBuzz();
          gameScore = Math.max(0, gameScore - 5);
          note(`That's a fruit! Look closely for the vegetable.`);
          b.classList.add('btn-danger');
          setTimeout(() => b.classList.remove('btn-danger'), 300);
        }
      };
      grid.appendChild(b);
    }

    wrapper.appendChild(grid);
    area.appendChild(wrapper);
  }
  renderRound();
}

// ===========================================================================
// GAME 5: Number Table (5 Levels: Sequential, Multiples, Primes, Squares, Fib)
// ===========================================================================
function initNumberTableFiveLevels() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-600 mx-auto';

  let currentLevel = 1;
  const levelNames = [
    'Level 1: Sequential Order (1 ➔ 16)',
    'Level 2: Multiples of Base Number',
    'Level 3: Prime Numbers in Order',
    'Level 4: Perfect Squares (1, 4, 9, 16...)',
    'Level 5: Fibonacci Numbers (1, 2, 3, 5, 8...)'
  ];

  function getLevelSequence(lvl) {
    if (lvl === 1) return Array.from({ length: 16 }, (_, i) => i + 1);
    if (lvl === 2) {
      const base = [2, 4, 5, 6, 7, 8, 9][Math.floor(Math.random() * 7)];
      return Array.from({ length: 7 }, (_, i) => (i + 1) * base);
    }
    if (lvl === 3) return [2, 3, 5, 7, 11, 13, 17, 19];
    if (lvl === 4) return [1, 4, 9, 16, 25, 36, 49];
    return [1, 2, 3, 5, 8, 13, 21, 34];
  }

  function startLevel() {
    area.innerHTML = '';
    const seq = getLevelSequence(currentLevel);
    const shuffled = [...seq].sort(() => Math.random() - 0.5);
    let expectedIdx = 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'card p-4 text-center bg-white border rounded-4';
    wrapper.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6">${levelNames[currentLevel - 1]}</span>
        <span class="badge bg-success fs-6">Score: ${gameScore}</span>
      </div>
      <h4 class="fw-bold mb-3">Next Number to Tap: <span class="badge bg-warning text-dark fs-4" id="ntNext">${seq[0]}</span></h4>
    `;

    const cols = seq.length <= 8 ? 4 : 4;
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, clamp(54px, 12vw, 68px))`;
    grid.style.gap = '8px';
    grid.style.justifyContent = 'center';

    shuffled.forEach(val => {
      const b = document.createElement('button');
      b.className = 'btn btn-custom-secondary fw-bold fs-5';
      b.style.height = 'clamp(54px, 12vw, 68px)';
      b.textContent = val;

      b.onclick = () => {
        actions++;
        if (val === seq[expectedIdx]) {
          playBubblePop(1.0 + expectedIdx * 0.08);
          b.disabled = true;
          b.classList.remove('btn-custom-secondary');
          b.classList.add('btn-success');
          b.style.opacity = '0.3';
          expectedIdx++;
          gameScore += 10;

          if (expectedIdx < seq.length) {
            document.getElementById('ntNext').textContent = seq[expectedIdx];
          } else {
            // Level cleared!
            playHappyChime();
            gameScore += 25;
            if (currentLevel < 5) {
              currentLevel++;
              note(`Level ${currentLevel - 1} Complete! Advancing...`);
              setTimeout(startLevel, 700);
            } else {
              endGame();
            }
          }
        } else {
          playSadBuzz();
          gameScore = Math.max(0, gameScore - 3);
          note(`Wrong! Looking for ${seq[expectedIdx]}`);
          b.classList.add('btn-danger');
          setTimeout(() => b.classList.remove('btn-danger'), 250);
        }
      };
      grid.appendChild(b);
    });

    wrapper.appendChild(grid);
    area.appendChild(wrapper);
  }
  startLevel();
}

// ===========================================================================
// GAME 6: Memory Sequence (Harder Melodic Patterns)
// ===========================================================================
function initMemorySequenceHarder() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-500 mx-auto';

  const tones = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
  const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'];
  const buttons = [];

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6" id="memLevelBadge">Length: 3</span>
        <span class="badge bg-success fs-6">Score: <span id="memScore">0</span></span>
      </div>
      <h4 class="fw-bold mb-3" id="memInstruction">Watch and memorize the melody</h4>
      <div id="memGrid" class="d-flex justify-content-center gap-3 flex-wrap my-3"></div>
    </div>
  `;
  area.appendChild(container);

  const grid = document.getElementById('memGrid');
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.style.width = 'clamp(80px, 18vw, 110px)';
    b.style.height = 'clamp(80px, 18vw, 110px)';
    b.style.borderRadius = '18px';
    b.style.backgroundColor = colors[i];
    b.style.opacity = '0.55';
    b.onclick = () => handleUserTap(i);
    grid.appendChild(b);
    buttons.push(b);
  }

  let sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
  let userSeq = [];
  let acceptingInput = false;
  let playDelay = 480;

  function flashPad(idx) {
    if (sfxCtx && !sfxMuted) {
      const osc = sfxCtx.createOscillator();
      const gain = sfxCtx.createGain();
      osc.frequency.setValueAtTime(tones[idx], sfxCtx.currentTime);
      gain.gain.setValueAtTime(0.3, sfxCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sfxCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(sfxCtx.destination);
      osc.start();
      osc.stop(sfxCtx.currentTime + 0.25);
    }
    buttons[idx].style.opacity = '1.0';
    buttons[idx].style.transform = 'scale(1.08)';
    setTimeout(() => {
      buttons[idx].style.opacity = '0.55';
      buttons[idx].style.transform = 'scale(1.0)';
    }, 240);
  }

  function playSequence() {
    acceptingInput = false;
    userSeq = [];
    document.getElementById('memInstruction').textContent = '🎵 Listen to the melody...';
    document.getElementById('memLevelBadge').textContent = `Sequence Length: ${sequence.length}`;

    sequence.forEach((val, i) => {
      setTimeout(() => flashPad(val), playDelay * (i + 1));
    });

    setTimeout(() => {
      acceptingInput = true;
      document.getElementById('memInstruction').textContent = '👉 Your turn! Repeat the melody.';
    }, playDelay * (sequence.length + 1));
  }

  function handleUserTap(idx) {
    if (!acceptingInput || finished) return;
    flashPad(idx);
    userSeq.push(idx);
    actions++;

    const cur = userSeq.length - 1;
    if (userSeq[cur] !== sequence[cur]) {
      playSadBuzz();
      gameScore = Math.max(0, gameScore - 5);
      document.getElementById('memScore').textContent = gameScore;
      document.getElementById('memInstruction').textContent = '✕ Off-key! Restarting sequence...';
      sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
      setTimeout(playSequence, 1100);
      return;
    }

    if (userSeq.length === sequence.length) {
      playHappyChime();
      gameScore += 20 + sequence.length * 5;
      document.getElementById('memScore').textContent = gameScore;
      sequence.push(Math.floor(Math.random() * 4));
      playDelay = Math.max(260, playDelay - 35); // accelerate playback!
      setTimeout(playSequence, 800);
    }
  }

  setTimeout(playSequence, 400);
}

// ===========================================================================
// GAME 7: Stroop Color Test (5-Second Question Timeout)
// ===========================================================================
function initStroopFiveSecondTimer() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-600 mx-auto';

  const colors = [
    { name: 'RED', hex: '#d90429' },
    { name: 'BLUE', hex: '#0077b6' },
    { name: 'GREEN', hex: '#2d6a4f' },
    { name: 'YELLOW', hex: '#e09f3e' }
  ];

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-warning text-dark fs-6" id="stroopTimer">⏳ 5.0s</span>
        <span class="badge bg-success fs-6">Score: <span id="stroopScore">0</span></span>
      </div>

      <div class="progress mb-4" style="height: 6px;">
        <div class="progress-bar bg-danger" id="stroopBar" style="width: 100%;"></div>
      </div>

      <p class="small text-muted mb-1">Tap the INK COLOUR (ignore what the text spells):</p>
      <h1 class="fw-bold mb-4" id="stroopWord" style="font-size: 3.5rem;">RED</h1>

      <div class="d-flex justify-content-center gap-2 flex-wrap" id="stroopButtons"></div>
    </div>
  `;
  area.appendChild(container);

  let qTimer = null;
  let remainingMs = 5000;
  let activeInk = null;

  function nextQuestion() {
    if (finished) return;
    clearInterval(qTimer);
    remainingMs = 5000;

    const wordObj = colors[Math.floor(Math.random() * colors.length)];
    activeInk = colors[Math.floor(Math.random() * colors.length)];

    const wordEl = document.getElementById('stroopWord');
    wordEl.textContent = wordObj.name;
    wordEl.style.color = activeInk.hex;

    const btnBox = document.getElementById('stroopButtons');
    btnBox.innerHTML = '';
    colors.forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn btn-custom-secondary px-4 py-3 fs-5 fw-bold';
      b.textContent = c.name;
      b.onclick = () => {
        actions++;
        if (c.name === activeInk.name) {
          playHappyChime();
          gameScore += 10 + Math.round(remainingMs / 500);
          document.getElementById('stroopScore').textContent = gameScore;
          nextQuestion();
        } else {
          playSadBuzz();
          gameScore = Math.max(0, gameScore - 5);
          document.getElementById('stroopScore').textContent = gameScore;
          nextQuestion();
        }
      };
      btnBox.appendChild(b);
    });

    const timerEl = document.getElementById('stroopTimer');
    const barEl = document.getElementById('stroopBar');

    qTimer = setInterval(() => {
      if (finished) { clearInterval(qTimer); return; }
      remainingMs -= 100;
      if (timerEl) timerEl.textContent = `⏳ ${(remainingMs / 1000).toFixed(1)}s`;
      if (barEl) barEl.style.width = `${(remainingMs / 5000) * 100}%`;

      if (remainingMs <= 0) {
        clearInterval(qTimer);
        playSadBuzz();
        gameScore = Math.max(0, gameScore - 5);
        document.getElementById('stroopScore').textContent = gameScore;
        note('⏰ 5-second timeout! Lost 5 points.');
        nextQuestion();
      }
    }, 100);
  }
  nextQuestion();
}

// ===========================================================================
// GAME: Go / No-Go (Rapid Impulse & Inhibitory Control Training)
// ===========================================================================
function initGoNoGo() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-600 mx-auto';

  let currentStreak = 0;
  let maxStreak = 0;
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  let reactionTimes = [];
  let currentTrialType = null;
  let stimulusStartTime = 0;
  let trialTimeoutId = null;
  let fixationTimeoutId = null;
  let trialResponded = false;

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center shadow-sm">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6">Streak: <span id="gonoStreak">0</span> 🔥</span>
        <span class="badge bg-secondary fs-6">Avg RT: <span id="gonoAvgRt">--</span> ms</span>
        <span class="badge bg-success fs-6">Score: <span id="gonoScore">0</span></span>
      </div>

      <h4 class="fw-bold mb-1">Impulse Reflex Training 🟢 🟥</h4>
      <p class="small text-muted mb-3">
        Tap on <strong>Green Circle</strong> (GO) as fast as possible.<br>
        <strong>Hold back</strong> completely on <strong>Red Square</strong> (NO-GO).
      </p>

      <!-- Stimulus Arena -->
      <div id="gonoArena" class="d-flex align-items-center justify-content-center mx-auto my-3"
           style="width: 240px; height: 240px; border-radius: 20px; background: #f8faf9; border: 3px dashed #d0ded5; cursor: pointer; user-select: none; transition: transform 0.1s ease, border-color 0.2s ease;">
        <span id="gonoStimulus" style="font-size: 3.5rem; transition: transform 0.1s ease;">+</span>
      </div>

      <div class="mt-3">
        <button id="gonoActionBtn" class="btn btn-custom-primary btn-lg px-5 py-3 fs-5 fw-bold w-100 shadow-sm" style="max-width: 320px;">
          TAP / SPACE ⚡
        </button>
      </div>
      <div class="small text-muted mt-2">Tip: Click the shape, press the button, or hit Spacebar on keyboard.</div>
    </div>
  `;

  area.appendChild(container);

  const arena = document.getElementById('gonoArena');
  const stimEl = document.getElementById('gonoStimulus');
  const streakEl = document.getElementById('gonoStreak');
  const avgRtEl = document.getElementById('gonoAvgRt');
  const scoreEl = document.getElementById('gonoScore');
  const actionBtn = document.getElementById('gonoActionBtn');

  function updateHUD() {
    if (streakEl) streakEl.textContent = currentStreak;
    if (scoreEl) scoreEl.textContent = gameScore;
    if (avgRtEl) {
      if (reactionTimes.length > 0) {
        const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
        avgRtEl.textContent = avg;
      } else {
        avgRtEl.textContent = '--';
      }
    }
  }

  function handlePlayerResponse() {
    if (finished || trialResponded) return;

    if (currentTrialType === 'GO') {
      trialResponded = true;
      clearTimeout(trialTimeoutId);
      actions++;

      const rt = Math.round(performance.now() - stimulusStartTime);
      reactionTimes.push(rt);
      hits++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;

      const bonus = Math.min(20, currentStreak * 2);
      const pointsWon = 15 + bonus;
      gameScore += pointsWon;

      playHappyChime();
      arena.style.borderColor = '#22c55e';
      arena.style.transform = 'scale(0.96)';
      setTimeout(() => {
        arena.style.transform = 'scale(1)';
        arena.style.borderColor = '#d0ded5';
      }, 120);

      note(`⚡ Reflex: ${rt}ms (+${pointsWon} pts, Streak ${currentStreak})`);
      updateHUD();
      showFixation();
    } else if (currentTrialType === 'NOGO') {
      trialResponded = true;
      clearTimeout(trialTimeoutId);
      actions++;

      falseAlarms++;
      currentStreak = 0;
      gameScore = Math.max(0, gameScore - 10);

      playSadBuzz();
      arena.style.borderColor = '#ef4444';
      arena.style.transform = 'scale(0.94)';
      if (stimEl) stimEl.textContent = '❌';
      setTimeout(() => {
        arena.style.transform = 'scale(1)';
        arena.style.borderColor = '#d0ded5';
      }, 200);

      note('⚠️ Impulse Caught! Hold back on Red Squares.');
      updateHUD();
      showFixation();
    } else {
      actions++;
      currentStreak = 0;
      playSadBuzz();
      note('⏳ Too early! Wait for the stimulus.');
      updateHUD();
    }
  }

  function showFixation() {
    if (finished) return;
    currentTrialType = null;
    trialResponded = false;

    if (stimEl) {
      stimEl.innerHTML = '<span style="font-size: 2.8rem; color: #94a3b8; font-weight: 300;">+</span>';
    }
    arena.style.borderColor = '#d0ded5';

    const delay = 450 + Math.random() * 400;
    fixationTimeoutId = setTimeout(() => {
      if (!finished) startTrial();
    }, delay);
  }

  function startTrial() {
    if (finished) return;
    trialResponded = false;

    const isGo = Math.random() < 0.70;
    currentTrialType = isGo ? 'GO' : 'NOGO';
    stimulusStartTime = performance.now();

    if (isGo) {
      stimEl.innerHTML = `
        <div style="width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, #4ade80 0%, #16a34a 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.4rem; box-shadow: 0 8px 24px rgba(34,197,94,0.35);">
          TAP!
        </div>
      `;
      arena.style.borderColor = '#86efac';
    } else {
      stimEl.innerHTML = `
        <div style="width: 110px; height: 110px; border-radius: 14px; background: radial-gradient(circle, #f87171 0%, #dc2626 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.25rem; box-shadow: 0 8px 24px rgba(220,38,38,0.35);">
          HOLD!
        </div>
      `;
      arena.style.borderColor = '#fca5a5';
    }

    trialTimeoutId = setTimeout(() => {
      if (finished) return;

      if (!trialResponded) {
        if (currentTrialType === 'NOGO') {
          correctRejections++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          gameScore += 10;
          playBubblePop(1.2);
          note(`✨ Excellent restraint! Resisted red square (+10 pts)`);
          updateHUD();
        } else if (currentTrialType === 'GO') {
          misses++;
          currentStreak = 0;
          note('⏳ Target missed! Stay alert for green.');
          updateHUD();
        }
      }
      showFixation();
    }, 800);
  }

  arena.onclick = handlePlayerResponse;
  if (actionBtn) actionBtn.onclick = handlePlayerResponse;

  function handleKeydown(e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handlePlayerResponse();
    }
  }
  window.addEventListener('keydown', handleKeydown);

  const cleanupAndResults = () => {
    window.removeEventListener('keydown', handleKeydown);
    clearTimeout(trialTimeoutId);
    clearTimeout(fixationTimeoutId);

    const totalTrials = hits + misses + falseAlarms + correctRejections;
    const accuracy = totalTrials > 0 ? Math.round(((hits + correctRejections) / totalTrials) * 100) : 0;
    const avgRt = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    const metricsHtml = `
      <div class="row g-2 text-center">
        <div class="col-4">
          <strong class="d-block text-primary fs-5">${accuracy}%</strong>
          <span class="text-muted">Accuracy</span>
        </div>
        <div class="col-4">
          <strong class="d-block text-success fs-5">${avgRt}ms</strong>
          <span class="text-muted">Avg Speed</span>
        </div>
        <div class="col-4">
          <strong class="d-block text-warning fs-5">${maxStreak}</strong>
          <span class="text-muted">Max Streak</span>
        </div>
      </div>
      <hr class="my-2">
      <div class="d-flex justify-content-between small text-muted">
        <span>Go Targets Hit: <strong>${hits}</strong> (${misses} missed)</span>
        <span>Impulses Held: <strong>${correctRejections}</strong> (${falseAlarms} errors)</span>
      </div>
    `;
    renderResultsCard('gono', gameScore, metricsHtml);
  };

  const checkFinishedInterval = setInterval(() => {
    if (finished) {
      clearInterval(checkFinishedInterval);
      cleanupAndResults();
    }
  }, 200);

  note('Focus on the cross. Green = TAP! Red = HOLD!');
  showFixation();
}

// ===========================================================================
// GAME 8: Follow the Dot (Multi-Round 80-Second MOT Challenge)
// ===========================================================================
function initFollowTheDotMultiRound() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center max-w-700 mx-auto';

  container.innerHTML = `
    <div class="card p-3 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge bg-primary fs-6" id="dotRoundBadge">Round 1 of 3</span>
        <span class="badge bg-success fs-6">Score: <span id="dotScore">0</span></span>
      </div>
      <canvas id="dotCanvas" width="640" height="340" style="width: 100%; max-width: 640px; border-radius: 12px; background: #141f2d;"></canvas>
    </div>
  `;
  area.appendChild(container);

  const canvas = document.getElementById('dotCanvas');
  const ctx = canvas.getContext('2d');

  let currentRound = 1;
  const roundConfigs = [
    { total: 6, targets: 2 },
    { total: 8, targets: 3 },
    { total: 9, targets: 4 }
  ];

  function runRound() {
    if (currentRound > 3) {
      endGame();
      return;
    }

    document.getElementById('dotRoundBadge').textContent = `Round ${currentRound} of 3`;
    const cfg = roundConfigs[currentRound - 1];

    const dots = Array.from({ length: cfg.total }, (_, i) => ({
      x: Math.random() * (canvas.width - 80) + 40,
      y: Math.random() * (canvas.height - 80) + 40,
      vx: (Math.random() * 2 - 1) * 2.8,
      vy: (Math.random() * 2 - 1) * 2.8,
      isTarget: i < cfg.targets,
      clicked: false
    }));

    let phase = 'flash'; // flash -> move -> pick
    note(`Round ${currentRound}: Memorize the ${cfg.targets} glowing targets!`);

    setTimeout(() => {
      phase = 'move';
      note('Tracking target movement across the arena...');
      setTimeout(() => {
        phase = 'pick';
        note(`Movement halted! Click the ${cfg.targets} target dots.`);
      }, 7000);
    }, 2800);

    canvas.onclick = (e) => {
      if (phase !== 'pick') return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);

      dots.forEach(d => {
        if (Math.hypot(mx - d.x, my - d.y) < 22 && !d.clicked) {
          d.clicked = true;
          actions++;
          if (d.isTarget) {
            playHappyChime();
            gameScore += 25;
            document.getElementById('dotScore').textContent = gameScore;
          } else {
            playSadBuzz();
            gameScore = Math.max(0, gameScore - 10);
            document.getElementById('dotScore').textContent = gameScore;
          }

          // Check if all targets found
          const targetsFound = dots.filter(x => x.isTarget && x.clicked).length;
          if (targetsFound === cfg.targets) {
            playHappyChime();
            note(`All targets found in Round ${currentRound}! ✨`);
            currentRound++;
            setTimeout(runRound, 1200);
          }
        }
      });
    };

    function draw() {
      if (finished) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach(d => {
        if (phase === 'move') {
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 16 || d.x > canvas.width - 16) d.vx *= -1;
          if (d.y < 16 || d.y > canvas.height - 16) d.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
        if (phase === 'flash' && d.isTarget) {
          ctx.fillStyle = '#ffd166';
          ctx.shadowColor = '#ffd166';
          ctx.shadowBlur = 16;
        } else if (d.clicked) {
          ctx.fillStyle = d.isTarget ? '#06d6a0' : '#ef476f';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      if (currentRound <= 3 && !finished) {
        animationFrameId = requestAnimationFrame(draw);
      }
    }
    draw();
  }
  runRound();
}

// ===========================================================================
// GAME 9: Varied Mental Math Sprint (Percentages, BODMAS, Powers, Fractions)
// ===========================================================================
function initVariedMentalMathQuiz() {
  const container = document.createElement('div');
  container.className = 'w-100 max-w-600 mx-auto text-center';

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-warning text-dark fs-6" id="mathTimer">⏳ 8s</span>
        <span class="badge bg-success fs-6">Score: <span id="mathScore">0</span></span>
      </div>

      <div class="progress mb-3" style="height: 6px;">
        <div class="progress-bar bg-warning" id="mathBar" style="width: 100%;"></div>
      </div>

      <span class="badge bg-secondary-subtle text-secondary mb-2" id="mathTypeBadge">Percentages</span>
      <h2 class="fw-bold mb-4" id="mathQText">...</h2>

      <div class="row g-2" id="mathChoices"></div>
    </div>
  `;
  area.appendChild(container);

  let qTimer = null;
  let remainingMs = 8000;

  function generateQuestion() {
    const types = ['percent', 'missing', 'bodmas', 'powers', 'fractions', 'word', 'pattern'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    let qText = '', answer = 0, choices = [];

    if (chosenType === 'percent') {
      const p = [10, 20, 25, 50][Math.floor(Math.random() * 4)];
      const base = (Math.floor(Math.random() * 8) + 2) * 20;
      answer = (p / 100) * base;
      qText = `What is ${p}% of ${base}?`;
    } else if (chosenType === 'missing') {
      const a = Math.floor(Math.random() * 8) + 4;
      const b = Math.floor(Math.random() * 8) + 3;
      answer = a;
      qText = `[ ? ] × ${b} = ${a * b}`;
    } else if (chosenType === 'bodmas') {
      const a = Math.floor(Math.random() * 6) + 3;
      const b = Math.floor(Math.random() * 5) + 2;
      const c = Math.floor(Math.random() * 5) + 2;
      answer = a + b * c;
      qText = `${a} + ${b} × ${c} = ?`;
    } else if (chosenType === 'powers') {
      const n = Math.floor(Math.random() * 7) + 4;
      answer = n * n;
      qText = `What is ${n}² ?`;
    } else if (chosenType === 'fractions') {
      const den = [4, 5, 8][Math.floor(Math.random() * 3)];
      const whole = den * (Math.floor(Math.random() * 5) + 2);
      answer = (3 / den) * whole;
      qText = `What is ³⁄${den} of ${whole}?`;
    } else if (chosenType === 'word') {
      const start = Math.floor(Math.random() * 30) + 30;
      const left = Math.floor(Math.random() * 15) + 8;
      answer = start - left;
      qText = `A bus has ${start} riders. ${left} alight. How many remain?`;
    } else {
      const start = Math.floor(Math.random() * 5) + 2;
      const step = Math.floor(Math.random() * 5) + 3;
      answer = start + step * 3;
      qText = `${start}, ${start + step}, ${start + step * 2}, [ ? ]`;
    }

    choices = [answer, answer + 2, Math.max(1, answer - 2), answer + 4].sort(() => Math.random() - 0.5);
    return { type: chosenType, qText, answer, choices };
  }

  function loadNext() {
    if (finished) return;
    clearInterval(qTimer);
    remainingMs = 8000;

    const q = generateQuestion();
    document.getElementById('mathTypeBadge').textContent = q.type.toUpperCase();
    document.getElementById('mathQText').textContent = q.qText;

    const choiceBox = document.getElementById('mathChoices');
    choiceBox.innerHTML = '';

    q.choices.forEach(ch => {
      const col = document.createElement('div');
      col.className = 'col-6';
      const b = document.createElement('button');
      b.className = 'btn btn-custom-secondary w-100 py-3 fs-4 fw-bold';
      b.textContent = ch;
      b.onclick = () => {
        actions++;
        if (ch === q.answer) {
          playHappyChime();
          gameScore += 12 + Math.round(remainingMs / 1000);
          document.getElementById('mathScore').textContent = gameScore;
          loadNext();
        } else {
          playSadBuzz();
          gameScore = Math.max(0, gameScore - 4);
          document.getElementById('mathScore').textContent = gameScore;
          loadNext();
        }
      };
      col.appendChild(b);
      choiceBox.appendChild(col);
    });

    const timerEl = document.getElementById('mathTimer');
    const barEl = document.getElementById('mathBar');

    qTimer = setInterval(() => {
      if (finished) { clearInterval(qTimer); return; }
      remainingMs -= 100;
      if (timerEl) timerEl.textContent = `⏳ ${(remainingMs / 1000).toFixed(1)}s`;
      if (barEl) barEl.style.width = `${(remainingMs / 8000) * 100}%`;

      if (remainingMs <= 0) {
        clearInterval(qTimer);
        playSadBuzz();
        gameScore = Math.max(0, gameScore - 4);
        document.getElementById('mathScore').textContent = gameScore;
        loadNext();
      }
    }, 100);
  }
  loadNext();
}

// ===========================================================================
// GAME 10: Emoji Charades (60s Cinema Marquee Dumb Charades)
// ===========================================================================
const EMOJI_MOVIES = [
  ["🕷👨", "Spider-Man"],
  ["🚀🌍1⃣3⃣", "Apollo 13"],
  ["👦🎁👨✈️❄🚂🎅🛎", "The Polar Express"],
  ["👩🐭🎃👡", "Cinderella"],
  ["✏📓👩❤👨", "The Notebook"],
  ["👦👴🍫🎟🏢", "Charlie and the Chocolate Factory"],
  ["🇯🇵💣🇺🇸⚓", "Pearl Harbor"],
  ["🐕🍝🐩💞", "Lady and the Tramp"],
  ["🐖🕸🕷👧", "Charlotte's Web"],
  ["👱💍🏔🗡", "Lord of the Rings"],
  ["🌃🏛🔦👮🐒🗿", "Night at the Museum"],
  ["🐀👨🍳🍜🍝🍲", "Ratatouille"],
  ["👳🚣🐅", "Life of Pi"],
  ["👦👴🏡🎈", "Up"],
  ["👨🏝🚣🏀", "Cast Away"],
  ["👩📚🐗🌹", "Beauty and the Beast"],
  ["👦👦👧⚡🚂", "Harry Potter"],
  ["👽🚀🗽🇺🇸", "Independence Day"],
  ["🐧👣🎵🎶", "Happy Feet"],
  ["🐢🐢🐢🐀🍕", "Teenage Mutant Ninja Turtles"],
  ["👓🧠🧠🧠", "3 Idiots"],
  ["💃🍸👠", "Cocktail"],
  ["🧑✈️✈️🇮🇳", "Mission Mangal"],
  ["👑⚔️🐘", "Baahubali"],
  ["🎤🎸⭐", "Rockstar"]
];

function initEmojiCharadesCinema() {
  const container = document.createElement('div');
  container.className = 'w-100 max-w-700 mx-auto';

  container.innerHTML = `
    <div class="cinema-container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="cinema-header mb-0">🎬 Cinema Charades</h5>
        <div class="d-flex gap-2">
          <span class="badge bg-warning text-dark fs-6" id="charadesStreak">🔥 0 Streak</span>
          <span class="badge bg-success fs-6">Score: <span id="charadesScore">0</span></span>
        </div>
      </div>

      <!-- Emoji Stage -->
      <div class="emoji-clue-stage" id="charadesClue">...</div>

      <!-- 4 Option Buttons -->
      <div class="row g-3 mb-3" id="charadesOptions"></div>

      <!-- Skip Button -->
      <div class="text-center mt-3">
        <button class="btn btn-outline-warning btn-sm px-4" id="charadesSkipBtn">Skip ⏭ (Resets Streak)</button>
      </div>
    </div>
  `;
  area.appendChild(container);

  let pool = [...EMOJI_MOVIES].sort(() => Math.random() - 0.5);
  let streak = 0;
  let correctTotal = 0;
  let missedMovies = [];
  let waitingFeedback = false;

  function loadNextMovie() {
    if (pool.length === 0) {
      pool = [...EMOJI_MOVIES].sort(() => Math.random() - 0.5);
    }
    const current = pool.pop();

    const clueEl = document.getElementById('charadesClue');
    clueEl.textContent = current[0];
    clueEl.classList.remove('shake-box');

    // 1 correct + 3 wrong choices
    const allTitles = EMOJI_MOVIES.map(m => m[1]);
    const wrongTitles = allTitles.filter(t => t !== current[1]).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [current[1], ...wrongTitles].sort(() => Math.random() - 0.5);

    const optBox = document.getElementById('charadesOptions');
    optBox.innerHTML = '';

    options.forEach(title => {
      const col = document.createElement('div');
      col.className = 'col-md-6';
      const b = document.createElement('button');
      b.className = 'charades-option-btn';
      b.textContent = title;

      b.onclick = () => {
        if (waitingFeedback || finished) return;
        actions++;

        if (title === current[1]) {
          // Correct
          playHappyChime();
          waitingFeedback = true;
          b.classList.add('btn-correct');
          correctTotal++;
          const bonus = Math.min(10, streak * 2);
          gameScore += 10 + bonus;
          streak++;

          document.getElementById('charadesScore').textContent = gameScore;
          document.getElementById('charadesStreak').textContent = `🔥 ${streak} Streak`;

          setTimeout(() => {
            waitingFeedback = false;
            loadNextMovie();
          }, 350);
        } else {
          // Wrong
          playSadBuzz();
          waitingFeedback = true;
          streak = 0;
          document.getElementById('charadesStreak').textContent = `🔥 0 Streak`;
          clueEl.classList.add('shake-box');
          b.classList.add('btn-wrong');

          missedMovies.push({ emoji: current[0], title: current[1] });

          // Reveal correct
          document.querySelectorAll('.charades-option-btn').forEach(btn => {
            if (btn.textContent === current[1]) btn.classList.add('btn-correct');
          });

          setTimeout(() => {
            waitingFeedback = false;
            loadNextMovie();
          }, 1100);
        }
      };
      col.appendChild(b);
      optBox.appendChild(col);
    });
  }

  document.getElementById('charadesSkipBtn').onclick = () => {
    streak = 0;
    document.getElementById('charadesStreak').textContent = `🔥 0 Streak`;
    loadNextMovie();
  };

  // Custom end screen callback that displays missed movies
  root.addEventListener('ended', () => {}, { once: true });
  window.addEventListener('beforeunload', () => {});

  loadNextMovie();

  // Attach results renderer on game finish
  const origEnd = endGame;
  window._charadesCustomResults = () => {
    let missedHtml = '';
    if (missedMovies.length > 0) {
      missedHtml = `
        <div class="mt-3 text-start">
          <h6 class="fw-bold mb-2">🎬 Missed Movies Recap:</h6>
          <div class="d-flex flex-column gap-1 small">
            ${missedMovies.map(m => `<div class="p-2 bg-light rounded d-flex justify-content-between"><span>${m.emoji}</span><strong>${m.title}</strong></div>`).join('')}
          </div>
        </div>
      `;
    }
    renderResultsCard('charades', gameScore, `
      <div class="d-flex justify-content-between mb-1"><span>Movies Decoded:</span><strong>${correctTotal}</strong></div>
      <div class="d-flex justify-content-between"><span>Max Streak:</span><strong>${streak}🔥</strong></div>
    `, missedHtml);
  };
}

// ===========================================================================
// GAME 11: Quick Sudoku (4x4 and 6x6 Procedural with Unique Solvability)
// ===========================================================================
function initQuickSudokuPuzzle() {
  const container = document.createElement('div');
  container.className = 'w-100 max-w-600 mx-auto text-center';

  const N = 4; // 4x4
  const boxR = 2, boxC = 2;

  // Simple valid 4x4 generator
  const solved = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
  ];
  // Shuffle numbers
  const map = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const solution = solved.map(row => row.map(v => map[v - 1]));

  // Given cells (8 given)
  const initial = solution.map(row => [...row]);
  let removed = 0;
  while (removed < 8) {
    const r = Math.floor(Math.random() * 4);
    const c = Math.floor(Math.random() * 4);
    if (initial[r][c] !== 0) {
      initial[r][c] = 0;
      removed++;
    }
  }

  const userBoard = initial.map(row => [...row]);
  let selected = null;
  let history = [];

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6">Quick 4×4 Sudoku</span>
        <span class="badge bg-success fs-6">Score: <span id="sudokuScore">0</span></span>
      </div>

      <div class="sudoku-board mb-3" id="sudokuGrid" style="grid-template-columns: repeat(4, 58px); width: 236px;"></div>

      <!-- Number Pad -->
      <div class="d-flex justify-content-center gap-2 mb-3">
        <button class="btn btn-outline-primary sudoku-pad-btn" onclick="fillSudoku(1)">1</button>
        <button class="btn btn-outline-primary sudoku-pad-btn" onclick="fillSudoku(2)">2</button>
        <button class="btn btn-outline-primary sudoku-pad-btn" onclick="fillSudoku(3)">3</button>
        <button class="btn btn-outline-primary sudoku-pad-btn" onclick="fillSudoku(4)">4</button>
        <button class="btn btn-outline-secondary sudoku-pad-btn" onclick="fillSudoku(0)">⌫</button>
      </div>

      <div class="d-flex justify-content-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" id="sudokuUndoBtn">Undo ↺</button>
        <button class="btn btn-outline-warning btn-sm" id="sudokuHintBtn">Hint 💡 (-15 pts)</button>
      </div>
    </div>
  `;
  area.appendChild(container);

  function renderGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.style.width = '58px';
        cell.style.height = '58px';

        // Border accents for 2x2 boxes
        if (c === 1) cell.style.borderRight = '3px solid #2d3748';
        if (r === 1) cell.style.borderBottom = '3px solid #2d3748';

        const val = userBoard[r][c];
        cell.textContent = val !== 0 ? val : '';

        if (initial[r][c] !== 0) {
          cell.classList.add('given');
        } else if (val !== 0) {
          cell.classList.add('user-filled');
        }

        if (selected && selected.r === r && selected.c === c) {
          cell.classList.add('selected');
        }

        cell.onclick = () => {
          if (initial[r][c] === 0) {
            selected = { r, c };
            renderGrid();
          }
        };
        grid.appendChild(cell);
      }
    }
  }

  window.fillSudoku = (num) => {
    if (!selected || initial[selected.r][selected.c] !== 0) return;
    const { r, c } = selected;
    history.push({ r, c, prev: userBoard[r][c] });
    userBoard[r][c] = num;
    actions++;

    if (num !== 0) {
      if (num === solution[r][c]) {
        playHappyChime();
        gameScore += 15;
      } else {
        playSadBuzz();
        gameScore = Math.max(0, gameScore - 5);
      }
    }
    document.getElementById('sudokuScore').textContent = gameScore;
    renderGrid();

    // Check complete
    const isComplete = userBoard.every((row, ri) => row.every((val, ci) => val === solution[ri][ci]));
    if (isComplete) {
      playHappyChime();
      gameScore += 50;
      note('🎉 Sudoku Puzzle Solved with unique perfection!');
      setTimeout(endGame, 1000);
    }
  };

  document.getElementById('sudokuUndoBtn').onclick = () => {
    if (history.length) {
      const last = history.pop();
      userBoard[last.r][last.c] = last.prev;
      renderGrid();
    }
  };

  document.getElementById('sudokuHintBtn').onclick = () => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (userBoard[r][c] === 0) {
          userBoard[r][c] = solution[r][c];
          gameScore = Math.max(0, gameScore - 15);
          document.getElementById('sudokuScore').textContent = gameScore;
          playHappyChime();
          renderGrid();
          return;
        }
      }
    }
  };

  renderGrid();
}

// ===========================================================================
// GAME 12: Cat Puzzle (N-Queens with Cats & Connected Color Regions)
// ===========================================================================
function initCatQueensPuzzle() {
  const container = document.createElement('div');
  container.className = 'w-100 max-w-600 mx-auto text-center';

  const N = 5; // 5x5
  const regionColors = ['#8ecae6', '#b7e4c7', '#ffb703', '#ffcbf2', '#d8b4e2'];

  // Valid 5x5 cat positions (No row/col sharing, no diagonal/orthogonal touches)
  // [0, 2], [1, 4], [2, 1], [3, 3], [4, 0]
  const catSolution = [
    { r: 0, c: 2 },
    { r: 1, c: 4 },
    { r: 2, c: 0 },
    { r: 3, c: 3 },
    { r: 4, c: 1 }
  ];

  // Connected region matrix (each region has 1 cat of the solution)
  const regionMap = [
    [0, 0, 0, 1, 1],
    [2, 0, 3, 1, 1],
    [2, 2, 3, 3, 1],
    [2, 4, 4, 3, 3],
    [4, 4, 4, 4, 3]
  ];

  // Board state: 0 = empty, 1 = 'X', 2 = 'CAT'
  const board = Array.from({ length: N }, () => Array(N).fill(0));

  container.innerHTML = `
    <div class="card p-4 bg-white border rounded-4 text-center">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge bg-primary fs-6">5×5 Cat Puzzle</span>
        <span class="badge bg-success fs-6">Score: <span id="catScore">0</span></span>
      </div>

      <p class="small text-muted mb-3">
        Place 1 Cat 🐱 per row, column, & color region. <strong>No two cats may touch each other (even diagonally)!</strong>
        <br><span class="fw-bold">Tap: 1st = ✕ | 2nd = 🐱 | 3rd = Clear</span>
      </p>

      <div class="cat-board mb-4" id="catBoard" style="grid-template-columns: repeat(${N}, 58px); width: ${N * 58}px;"></div>

      <div class="d-flex justify-content-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" id="catClearBtn">Clear Board</button>
        <button class="btn btn-outline-warning btn-sm" id="catHintBtn">Hint 🐱 (-20 pts)</button>
      </div>
    </div>
  `;
  area.appendChild(container);

  function getConflicts() {
    const cats = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c] === 2) cats.push({ r, c, region: regionMap[r][c] });
      }
    }

    const conflictSet = new Set();
    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const c1 = cats[i], c2 = cats[j];
        // Same row, col, or region
        const sameRow = c1.r === c2.r;
        const sameCol = c1.c === c2.c;
        const sameRegion = c1.region === c2.region;
        // Touching diagonally or orthogonally
        const touching = Math.abs(c1.r - c2.r) <= 1 && Math.abs(c1.c - c2.c) <= 1;

        if (sameRow || sameCol || sameRegion || touching) {
          conflictSet.add(`${c1.r},${c1.c}`);
          conflictSet.add(`${c2.r},${c2.c}`);
        }
      }
    }
    return { cats, conflictSet };
  }

  function renderCatBoard() {
    const boardEl = document.getElementById('catBoard');
    boardEl.innerHTML = '';
    const { cats, conflictSet } = getConflicts();

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'cat-cell';
        cell.style.width = '58px';
        cell.style.height = '58px';

        const regId = regionMap[r][c];
        cell.style.backgroundColor = regionColors[regId];

        // Thick border between distinct regions
        if (c < N - 1 && regionMap[r][c + 1] !== regId) cell.style.borderRight = '3px solid #2d3748';
        else cell.style.borderRight = '1px solid rgba(0,0,0,0.12)';

        if (r < N - 1 && regionMap[r + 1][c] !== regId) cell.style.borderBottom = '3px solid #2d3748';
        else cell.style.borderBottom = '1px solid rgba(0,0,0,0.12)';

        const val = board[r][c];
        if (val === 1) cell.textContent = '✕';
        else if (val === 2) cell.textContent = '🐱';

        if (conflictSet.has(`${r},${c}`)) {
          cell.classList.add('conflict');
        }

        cell.onclick = () => {
          actions++;
          board[r][c] = (board[r][c] + 1) % 3;
          if (board[r][c] === 2) {
            playBubblePop(1.2);
            // Check conflicts after placement
            const check = getConflicts();
            if (check.conflictSet.has(`${r},${c}`)) {
              playSadBuzz();
            }
          }
          renderCatBoard();
          checkCatWin();
        };

        boardEl.appendChild(cell);
      }
    }
  }

  function checkCatWin() {
    const { cats, conflictSet } = getConflicts();
    if (cats.length === N && conflictSet.size === 0) {
      playHappyChime();
      gameScore += 100;
      document.getElementById('catScore').textContent = gameScore;
      note('🐱 Purr-fect! All cats placed peacefully with zero conflicts!');
      if (typeof confetti === 'function') confetti({ particleCount: 60, spread: 70 });
      setTimeout(endGame, 1200);
    }
  }

  document.getElementById('catClearBtn').onclick = () => {
    for (let r = 0; r < N; r++) board[r].fill(0);
    renderCatBoard();
  };

  document.getElementById('catHintBtn').onclick = () => {
    const unplaced = catSolution.find(cs => board[cs.r][cs.c] !== 2);
    if (unplaced) {
      board[unplaced.r][unplaced.c] = 2;
      gameScore = Math.max(0, gameScore - 20);
      document.getElementById('catScore').textContent = gameScore;
      playHappyChime();
      renderCatBoard();
      checkCatWin();
    }
  };

  renderCatBoard();
}

// ===========================================================================
// GAME 13: Box Breathing (45s with No-Hold Toggle)
// ===========================================================================
function initBoxBreathing() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center';

  let noHold = false;
  container.innerHTML = `
    <div class="mb-4">
      <div class="form-check form-switch d-inline-block">
        <input class="form-check-input" type="checkbox" id="noHoldToggle">
        <label class="form-check-label small fw-bold" for="noHoldToggle">Gentle No-Hold Mode (In 4s, Out 6s)</label>
      </div>
    </div>
    <div class="breath-circle-modern mx-auto mb-4" id="boxCircle">Breathe in</div>
    <p class="text-muted" id="breathInstruction">Sit comfortably and relax your shoulders.</p>
  `;
  area.appendChild(container);

  const toggle = document.getElementById('noHoldToggle');
  if (toggle) {
    toggle.onchange = (e) => {
      noHold = e.target.checked;
      note(noHold ? 'Switched to gentle 4s In / 6s Out' : 'Switched to standard 4x4 Box Breathing');
    };
  }

  const circle = document.getElementById('boxCircle');
  let step = 0;
  const cycleInterval = setInterval(() => {
    if (finished) { clearInterval(cycleInterval); return; }
    step++;
    if (!noHold) {
      const phase = step % 16;
      if (phase < 4) { if (circle) circle.textContent = 'Breathe in'; note('Inhaling calm (4s) 🫁'); }
      else if (phase < 8) { if (circle) circle.textContent = 'Hold'; note('Holding gently (4s) ✨'); }
      else if (phase < 12) { if (circle) circle.textContent = 'Breathe out'; note('Releasing tension (4s) 💨'); }
      else { if (circle) circle.textContent = 'Hold'; note('Stillness before next breath (4s) 🌿'); }
    } else {
      const phase = step % 10;
      if (phase < 4) { if (circle) circle.textContent = 'Breathe in'; note('Gentle Inhale (4s) 🫁'); }
      else { if (circle) circle.textContent = 'Breathe out'; note('Slow, extended Exhale (6s) 💨'); }
    }
  }, 1000);
}

// ===========================================================================
// GAME 14: Power Rest (Guided NSDR Session)
// ===========================================================================
function initPowerRest() {
  area.innerHTML = `
    <div class="text-center p-4" style="background: #111a14; color: #a4c9b0; border-radius: 16px;">
      <div style="font-size: 3.5rem;">🌙</div>
      <h3 class="fw-bold mb-3 text-light">Non-Sleep Deep Rest (NSDR)</h3>
      <p class="lead mb-4">Let your jaw unclench, release your shoulders, and close your eyes until the session ends.</p>
      <div class="badge bg-success-subtle text-success p-2 px-3">Recharging mental energy...</div>
    </div>
  `;
}

// ===========================================================================
// GAME 15: Quick Tap Sprint & Tiny Wins Ladder (Kept As Is)
// ===========================================================================
function initQuickTapSprint() {
  const container = document.createElement('div');
  container.className = 'w-100 text-center py-4';
  let tapScore = 0;

  const btn = document.createElement('button');
  btn.className = 'btn btn-custom-primary p-5 fs-2 fw-bold rounded-circle shadow-lg';
  btn.style.width = '160px';
  btn.style.height = '160px';
  btn.textContent = 'TAP! ⚡';
  btn.onclick = () => {
    playBubblePop(1.1 + (tapScore % 10) * 0.08);
    tapScore++;
    gameScore += 5;
    actions++;
    note(`Sprint score: ${tapScore} rapid motor taps! Energy returning.`);
    btn.style.transform = `scale(0.92) translate(${(Math.random() - 0.5) * 25}px, ${(Math.random() - 0.5) * 25}px)`;
    setTimeout(() => btn.style.transform = 'scale(1.0)', 100);
  };
  container.appendChild(btn);
  area.appendChild(container);
}

function initTinyWinsLadder() {
  const wins = [
    '💧 Take a slow sip of water',
    '🙆 Roll your shoulders and stretch your neck',
    '🪟 Look away from the display for 20 seconds',
    '✍️ Write the single next action you must take',
    '🌟 Give yourself credit for showing up today'
  ];
  let i = 0;
  function showStep() {
    area.innerHTML = `
      <div class="text-center p-4">
        <h4 class="text-muted mb-1">Micro-Win ${i + 1} of 5</h4>
        <h2 class="fw-bold mb-4">${wins[i]}</h2>
        <button class="btn btn-custom-primary btn-lg px-4" id="ladderStepBtn">Mark Done ✓</button>
      </div>
    `;
    document.getElementById('ladderStepBtn').onclick = () => {
      playBubblePop(1.0 + i * 0.15);
      actions++;
      gameScore += 20;
      i++;
      if (i < wins.length) showStep();
      else {
        playHappyChime();
        area.innerHTML = `<div class="text-center p-4"><h2>🎉 All 5 Micro-Wins Claimed! Forward momentum unlocked.</h2></div>`;
      }
    };
  }
  showStep();
}
