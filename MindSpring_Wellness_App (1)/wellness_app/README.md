# 🌿 MindSpring: Student Mindful Wellness Platform

An evidence-informed, pressure-free digital sanctuary built to support student mental wellbeing, academic focus, and healthy digital screen habits.

Based on Project-Based Learning (PBL) specifications. Powered by Flask, SQLite, HTML5 Web Audio API, Bootstrap 5, and vanilla JavaScript.

---

## ✨ Features Implemented

* **Authentic Campus Design System**:
  * High-resolution, student-focused photography and clean layout (no generic AI clip-art).
  * Responsive navigation with mobile menu toggle and student status badges.
  * Real campus resources, FAQ accordion, and student testimonials.
* **Procedural Sound Sanctuary (Zero-Copyright Web Audio API)**:
  * Multi-track ambient sound mixer for *Gentle Rain*, *Ocean Surf*, *Deep Focus Brown Noise*, and *432 Hz Singing Bowl*.
  * Real-time canvas equalizer visualizer, individual channel volume sliders, and quick presets (*Deep Study*, *Rainy Cafe*, *Sleep Drift*).
  * 100% procedurally synthesized in the browser without external media licenses or network lag.
* **Interactive Daily Affirmation**:
  * Shufflable mindful thought deck on the student dashboard for gentle cognitive reframing.
* **One-Line Mindful Journal & Reflections**:
  * Quick daily check-in with tags (*Small Win*, *Gratitude*, *Exam Vent*, *Low Energy*, *Focus Note*) saved to SQLite.
* **13 Interactive Micro-Interventions (2 to 5 mins)**:
  * *Calming*: Stress Bubble Pop, Box Breathing (4x4), Grounding Quest (5-4-3-2-1), Calm the Ocean, Eye Rest (20-20-20), Power Rest.
  * *Stimulating*: Schulte Focus Grid (1–25), Stroop Color Test, Go / No-Go Reaction, Memory Sequence, Math Challenges, 2-Minute Start, Tiny Wins Ladder.
* **Anti-Cheat & Tab-Switch Tracking**:
  * Real active seconds tracked only when `!document.hidden`.
  * Celebratory canvas confetti particle burst on activity completion.
* **Persistent Accessibility**:
  * Reduce Motion and High Contrast toggles persisted across sessions via `localStorage`.
* **Configurable Site Identity**:
  * Change site name globally by setting `APP_NAME` in `.env` or `app.py`.

---

## 🚀 Running Locally

```bash
cd wellness_app

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the Flask app
python app.py
```

Open your browser at: **`http://127.0.0.1:5000`**

---

## 🔒 Safety & Disclaimers

* MindSpring is a student self-care and focus aid, **not a clinical diagnostic device or psychiatric treatment**.
* Integrated Crisis Helpline: **Tele-MANAS `14416` (India 24/7 Free)**.
