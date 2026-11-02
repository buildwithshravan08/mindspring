/**
 * MindSpring Application Client Logic
 * Accessibility persistence, mood selector, survey wizard, and interactive affirmations
 */

// 1. Accessibility State Persistence in localStorage
(function initAccessibility() {
  try {
    const prefs = JSON.parse(localStorage.getItem('mindspring_accessibility') || '{}');
    if (prefs['reduce-motion']) {
      document.body.classList.add('reduce-motion');
      const rmInput = document.getElementById('reduceMotionToggle');
      if (rmInput) rmInput.checked = true;
    }
    if (prefs['high-contrast']) {
      document.body.classList.add('high-contrast');
      const hcInput = document.getElementById('highContrastToggle');
      if (hcInput) hcInput.checked = true;
    }
  } catch (e) {
    console.warn('Could not read accessibility preferences:', e);
  }
})();

function toggleAccessibility(prefKey, isEnabled) {
  document.body.classList.toggle(prefKey, isEnabled);
  try {
    const prefs = JSON.parse(localStorage.getItem('mindspring_accessibility') || '{}');
    prefs[prefKey] = isEnabled;
    localStorage.setItem('mindspring_accessibility', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Could not save accessibility preferences:', e);
  }
}

// 2. Interactive Mood Chooser (Alias to selectMoodTab)
function chooseMood(moodName) {
  if (typeof selectMoodTab === 'function') {
    selectMoodTab(moodName);
  }
}

// 3. Multi-Step Survey Wizard
function initSurvey() {
  const steps = [...document.querySelectorAll('.survey-step')];
  if (!steps.length) return;

  let currentIdx = 0;
  const progressElem = document.getElementById('surveyProgress');
  const prevBtn = document.getElementById('prevQ');
  const nextBtn = document.getElementById('nextQ');
  const submitBtn = document.getElementById('submitQ');

  function renderStep() {
    steps.forEach((step, idx) => {
      step.style.display = idx === currentIdx ? 'block' : 'none';
    });

    const percent = Math.round(((currentIdx + 1) / steps.length) * 100);
    if (progressElem) progressElem.style.width = `${percent}%`;

    if (prevBtn) prevBtn.disabled = currentIdx === 0;
    if (nextBtn) nextBtn.hidden = currentIdx === steps.length - 1;
    if (submitBtn) submitBtn.hidden = currentIdx !== steps.length - 1;
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const activeStep = steps[currentIdx];
      const input = activeStep.querySelector('input, select');
      if (input && !input.checkValidity()) {
        input.reportValidity();
        return;
      }
      currentIdx++;
      renderStep();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentIdx > 0) {
        currentIdx--;
        renderStep();
      }
    };
  }

  renderStep();
}

// 4. Daily Affirmations Deck
const AFFIRMATIONS = [
  "Taking a pause right now is an investment in your focus, not a waste of study time. 🌿",
  "You don't need to finish everything today. Just take the single next smallest step. 🎯",
  "Your worth as a person is not defined by test scores or constant productivity. 💚",
  "Comparison is the thief of your peace. Your pace and progress are completely valid. ✨",
  "Exhale the academic pressure. Inhale this quiet present moment. 🫁",
  "Rest is a requirement, not a reward that must be earned. 🌙",
  "Mistakes and tough days are proof that you are stretching and growing. 🌱",
  "One deep breath can reset a spiral. You are safe in this moment. 🌊"
];

function shuffleAffirmation() {
  const textElem = document.getElementById('affirmationText');
  if (!textElem) return;

  textElem.style.opacity = '0';
  setTimeout(() => {
    const current = textElem.textContent;
    let next = current;
    while (next === current && AFFIRMATIONS.length > 1) {
      next = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    }
    textElem.textContent = next;
    textElem.style.opacity = '1';
  }, 200);
}

// 5. Journal Tag Selection
function selectJournalTag(chipElem, tagName) {
  document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
  chipElem.classList.add('active');
  const hiddenInput = document.getElementById('journalTagInput');
  if (hiddenInput) {
    hiddenInput.value = tagName;
  }
}
