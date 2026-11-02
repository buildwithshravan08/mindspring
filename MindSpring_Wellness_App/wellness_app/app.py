import os
import sqlite3
import json
import csv
import io
import datetime
import random
import secrets
from functools import wraps
from urllib.parse import urlparse

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify,
    Response,
    g,
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix

# Try loading .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)

# Security: Apply ProxyFix for correct IP and scheme behind reverse proxies (P2.10, P2.15)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Security: Request body size limit - 512 KB (P2.11)
app.config['MAX_CONTENT_LENGTH'] = 512 * 1024

# P1.2: SECRET_KEY validation - refuse to run in production without secure key
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    is_prod = (
        os.environ.get('FLASK_ENV') == 'production' or
        os.environ.get('PRODUCTION') == '1' or
        os.environ.get('RENDER') or
        os.environ.get('RAILWAY_ENVIRONMENT')
    )
    if is_prod:
        raise RuntimeError("CRITICAL: SECRET_KEY environment variable must be set in production.")
    SECRET_KEY = 'mindspring-dev-secret-key-2026'
app.secret_key = SECRET_KEY

# Configurable site identity
APP_NAME = os.environ.get('APP_NAME', 'MindSpring')

# P1.1: Fix DB_PATH fallback when DB_PATH="" in .env
DB = os.environ.get('DB_PATH') or os.path.join(os.path.dirname(__file__), 'wellness.db')

# P2.8: Admin credentials protection
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '').strip().lower()
ADMIN_SECRET = os.environ.get('ADMIN_SECRET', '').strip()

# Activity Catalog: (Title, Duration in seconds, kind, type, image_url, description)
ACTIVITIES = {
    'Stressed': [
        (
            'Stress Bubble Pop',
            45,
            'bubble',
            'stimulating',
            'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
            'Fast-paced arcade challenge: catch and pop rising stress bubbles with satisfying pop sounds before they escape.'
        ),
        (
            'Box Breathing',
            45,
            'breath',
            'calming',
            'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
            'Visual 4x4 box breathing reset with an optional gentle no-hold pacing.'
        )
    ],
    'Anxious': [
        (
            'Calm in the Ocean',
            75,
            'ocean',
            'calming',
            'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=80',
            'Top-down ocean odyssey: dodge tornados, jump sharks, dive under pirates, and reach the beach with the Sea God.'
        ),
        (
            'English Mastery Quiz',
            45,
            'ground',
            'stimulating',
            'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
            'Adaptive 10-question English challenge (vocabulary, grammar, idioms, spellings) across easy, medium, and hard tiers.'
        )
    ],
    'Distracted': [
        (
            'Odd One Out',
            45,
            'odd',
            'stimulating',
            'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
            'Spot the single vegetable hidden among fresh fruits across expanding grids.'
        ),
        (
            'Number Table',
            45,
            'schulte',
            'stimulating',
            'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
            '5 levels of numerical mastery: sequential numbers, random multiples, primes, perfect squares, and Fibonacci numbers.'
        ),
        (
            'Memory Sequence',
            45,
            'memory',
            'stimulating',
            'https://images.unsplash.com/photo-1507842229458-5777ab266dd9?auto=format&fit=crop&w=600&q=80',
            'Escalating musical memory challenge: repeat accelerating melodic light sequences.'
        ),
        (
            'Stroop Colour',
            45,
            'stroop',
            'stimulating',
            'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
            '5-second rapid reaction challenge: tap the INK color before the clock runs out!'
        ),
        (
            'Go / No-go',
            45,
            'gono',
            'stimulating',
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
            'Rapid impulse training: tap on green circles, hold back on red squares.'
        ),
        (
            'Follow the Dot',
            80,
            'dot',
            'stimulating',
            'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=600&q=80',
            'Multi-round visual tracking: memorize the glowing dots and identify them after chaotic movement.'
        )
    ],
    'Tired': [
        (
            'Math Sprint (Varied)',
            45,
            'math',
            'stimulating',
            'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
            'Dynamic mental-maths sprint: percentages, missing numbers, order of ops, estimation, powers, and word puzzles.'
        ),
        (
            'Wake-up Breathing',
            45,
            'wake',
            'stimulating',
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
            'Energizing 3s/3s breath rhythm with sunburst animation.'
        ),
        (
            'Power Rest',
            45,
            'power',
            'calming',
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
            'Guided Non-Sleep Deep Rest (NSDR) relaxation session.'
        )
    ],
    'Lazy': [
        (
            'Emoji Charades',
            60,
            'charades',
            'stimulating',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
            'Cinema Dumb Charades: decode 25 movie titles from emoji clues with streaks and marquee flair!'
        ),
        (
            'Quick Sudoku',
            75,
            'sudoku',
            'stimulating',
            'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=600&q=80',
            'Procedural 4x4 and 6x6 Sudoku with conflict alerts, undo, hints, and unique solutions.'
        ),
        (
            'Cat Puzzle (Queens)',
            90,
            'catpuzzle',
            'stimulating',
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
            'Place 1 cat per row, column, and colored region with zero diagonal touches.'
        ),
        (
            'Math Challenge (Varied)',
            45,
            'math',
            'stimulating',
            'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
            'Mental arithmetic challenges: percentages, estimation, order of operations, and pattern puzzles.'
        ),
        (
            'Quick Tap Sprint',
            30,
            'tap',
            'stimulating',
            'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80',
            'Fast motor reflex challenge to break afternoon scrolling sluggishness.'
        ),
        (
            'Tiny Wins Ladder',
            45,
            'ladder',
            'stimulating',
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
            'Complete 5 micro-actions to build dopamine and forward momentum.'
        )
    ]
}

QUESTIONS = [
    ('apps', 'Social media apps you use regularly', 'text', None),
    ('hours', 'Daily social media screen time', 'select', [
        'Under 1', '1 to 2', '2 to 3', '3 to 4', '4 to 5', '5 to 6', '6+'
    ]),
    ('hobbies', 'Hobbies & relaxation activities (comma-separated)', 'text', None),
    ('health', 'Health considerations (optional; helps tailor activities)', 'select', [
        'None', 'Anxiety or depression diagnosis', 'ADHD',
        'Sleep disorder', 'Epilepsy or photosensitivity',
        'Vision problems', 'Prefer not to say'
    ]),
    ('focus', 'How often do you lose focus during study?', 'select', [
        'Never', 'Rarely', 'Sometimes', 'Often', 'Always'
    ]),
    ('phone', 'How often do you check your phone without reason?', 'select', [
        'Never', 'Rarely', 'Sometimes', 'Often', 'Always'
    ]),
    ('pss1', 'In the last month, how often did you feel unable to control important things?', 'select', [
        'Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'
    ]),
    ('pss2', 'In the last month, how often did you feel confident handling personal problems?', 'select', [
        'Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'
    ]),
    ('pss3', 'In the last month, how often did you feel things were going your way?', 'select', [
        'Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'
    ]),
    ('pss4', 'In the last month, how often did difficulties pile up too high?', 'select', [
        'Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'
    ]),
    ('mood', 'Overall mood this past week', 'select', [
        'Very low', 'Low', 'Okay', 'Good', 'Very good'
    ]),
    ('sleep', 'Overall sleep quality this past week', 'select', [
        'Very poor', 'Poor', 'Okay', 'Good', 'Very good'
    ]),
    ('concern', 'Do you feel your digital screen habits are too high?', 'select', [
        'No', 'Somewhat', 'Yes'
    ])
]


# ============================================================================
# P2.14: Database Connection Lifecycle Management using flask.g and Teardown
# ============================================================================
def get_db():
    """Returns the application-context-managed SQLite connection."""
    if 'db' not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON;')
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    """Cleanly closes the database connection on request completion."""
    db_conn = g.pop('db', None)
    if db_conn is not None:
        db_conn.close()


def init():
    """Initializes SQLite schema tables."""
    conn = sqlite3.connect(DB)
    conn.execute('PRAGMA foreign_keys = ON;')
    with conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                dob TEXT,
                mobile TEXT,
                gender TEXT,
                college TEXT,
                year TEXT,
                field TEXT,
                consent INTEGER DEFAULT 0,
                created TEXT
            );

            CREATE TABLE IF NOT EXISTS surveys (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                kind TEXT,
                answers TEXT,
                score REAL,
                domains TEXT,
                pss_raw INTEGER,
                created TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                mood TEXT,
                intensity INTEGER,
                activity TEXT,
                started TEXT,
                ended TEXT,
                fraction REAL,
                switches INTEGER,
                score REAL,
                before INTEGER,
                after INTEGER,
                metrics TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS journals (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                mood TEXT,
                note TEXT,
                tag TEXT,
                created TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ''')
    conn.close()


init()


# ============================================================================
# P2.9: CSRF Token Management & Verification
# ============================================================================
def get_csrf_token():
    """Generate or retrieve session CSRF token."""
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_hex(24)
    return session['_csrf_token']


@app.before_request
def validate_csrf():
    """Validates CSRF tokens on all mutating HTTP requests."""
    if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
        # Extract token from form, header, or JSON body
        token = request.form.get('csrf_token') or request.headers.get('X-CSRF-Token')
        if not token and request.is_json:
            token = (request.get_json(silent=True) or {}).get('csrf_token')

        expected = session.get('_csrf_token')
        if not expected or not token or not secrets.compare_digest(token, expected):
            if request.is_json:
                return jsonify(ok=False, error="Security token expired or missing. Please refresh the page."), 403
            flash("Session security token expired. Please try submitting again.", "warning")
            return safe_redirect(request.referrer, fallback='index')


# ============================================================================
# P2.10: Rate Limiting & Throttling
# ============================================================================
_LOGIN_ATTEMPTS = {}

def check_login_rate_limit(ip, max_attempts=5, window_seconds=60):
    """Sliding-window IP rate limiter for login protection."""
    now = datetime.datetime.now().timestamp()
    attempts = [t for t in _LOGIN_ATTEMPTS.get(ip, []) if now - t < window_seconds]
    _LOGIN_ATTEMPTS[ip] = attempts
    return len(attempts) < max_attempts

def record_failed_login(ip):
    now = datetime.datetime.now().timestamp()
    _LOGIN_ATTEMPTS.setdefault(ip, []).append(now)

def clear_login_attempts(ip):
    _LOGIN_ATTEMPTS.pop(ip, None)


# ============================================================================
# P1.3 & P2.15: Helper Functions (Safe Display Name & Redirects)
# ============================================================================
def first_name(name):
    """P1.3: Safely extracts the first name without ever raising an IndexError."""
    if not name or not str(name).strip():
        return 'Student'
    parts = str(name).strip().split()
    return parts[0] if parts else 'Student'


def safe_redirect(target, fallback='home'):
    """P2.15: Safe redirection that prevents open redirects behind SSL proxies."""
    if target:
        parsed = urlparse(target)
        if not parsed.netloc or parsed.netloc == request.host:
            return redirect(target)
    return redirect(url_for(fallback))


def get_local_now(tz_offset_minutes=330):
    """P1.7: Returns the current datetime adjusted to the user's timezone (Default: IST +5:30)."""
    offset = session.get('tz_offset', tz_offset_minutes)
    utc_now = datetime.datetime.now(datetime.timezone.utc)
    return utc_now + datetime.timedelta(minutes=offset)


# ============================================================================
# User Authentication & Session Helpers
# ============================================================================
def user():
    """Fetch current user record from database."""
    if not session.get('uid'):
        return None
    c = get_db()
    return c.execute('SELECT * FROM users WHERE id = ?', (session['uid'],)).fetchone()


def login_required(fn):
    """P2.12: Validates that session uid exists AND user record is present in DB."""
    @wraps(fn)
    def wrapper(*a, **kw):
        if not session.get('uid') or not user():
            session.clear()
            flash('Please log in to continue.', 'warning')
            return redirect(url_for('login'))
        return fn(*a, **kw)
    return wrapper


def latest():
    """Fetch most recent survey for active user."""
    c = get_db()
    return c.execute(
        'SELECT * FROM surveys WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        (session['uid'],)
    ).fetchone()


def records():
    """Fetch all activity sessions for active user."""
    c = get_db()
    return c.execute(
        'SELECT * FROM sessions WHERE user_id = ? ORDER BY id DESC',
        (session['uid'],)
    ).fetchall()


def get_journals():
    """Fetch recent journal entries for active user."""
    c = get_db()
    return c.execute(
        'SELECT * FROM journals WHERE user_id = ? ORDER BY id DESC LIMIT 6',
        (session['uid'],)
    ).fetchall()


def label(x):
    """Categorical label for wellness scores."""
    if x >= 9.0:
        return 'Thriving & Resilient'
    elif x >= 7.0:
        return 'Balanced & Good'
    elif x >= 5.0:
        return 'Moderate Wellbeing'
    elif x >= 3.0:
        return 'Needs Gentle Attention'
    else:
        return 'Needs Extra Care & Support'


def scoring(a):
    """Compute domain scores and weighted overall wellness index from survey answers."""
    hours_map = dict(zip(['Under 1', '1 to 2', '2 to 3', '3 to 4', '4 to 5', '5 to 6', '6+'], [10, 8, 7, 5, 4, 3, 1]))
    frequency_map = dict(zip(['Never', 'Rarely', 'Sometimes', 'Often', 'Always'], [10, 7.5, 5, 2.5, 0]))
    pss_map = dict(zip(['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'], [10, 7.5, 5, 2.5, 0]))
    quality_map = dict(zip(['Very low', 'Low', 'Okay', 'Good', 'Very good'], [0, 2.5, 5, 7.5, 10]))
    sleep_map = dict(zip(['Very poor', 'Poor', 'Okay', 'Good', 'Very good'], [0, 2.5, 5, 7.5, 10]))
    concern_map = {'No': 10, 'Somewhat': 5, 'Yes': 2}

    domains = {
        'Attention & Focus': round((frequency_map[a['focus']] + frequency_map[a['phone']]) / 2, 1),
        'Digital Screen Habits': round((hours_map[a['hours']] + concern_map[a['concern']]) / 2, 1),
        'Perceived Stress': round((pss_map[a['pss1']] + (10 - pss_map[a['pss2']]) + (10 - pss_map[a['pss3']]) + pss_map[a['pss4']]) / 4, 1),
        'Overall Wellbeing': round((quality_map[a['mood']] + sleep_map[a['sleep']]) / 2, 1)
    }

    # PSS-4 standard raw calculation (0-16 scale)
    opts = ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often']
    raw = sum(
        opts.index(a['pss' + str(i)]) if i in (1, 4) else 4 - opts.index(a['pss' + str(i)])
        for i in range(1, 5)
    )

    score = round(
        domains['Attention & Focus'] * 0.25 +
        domains['Digital Screen Habits'] * 0.25 +
        domains['Perceived Stress'] * 0.30 +
        domains['Overall Wellbeing'] * 0.20,
        1
    )
    return score, domains, raw


@app.context_processor
def globals_():
    """Make global variables accessible across all Jinja templates."""
    u = user() if session.get('uid') else None
    return dict(
        app_name=APP_NAME,
        current_user=u,
        first_name=first_name,
        csrf_token=get_csrf_token(),
        now=get_local_now()
    )


@app.errorhandler(413)
def request_entity_too_large(error):
    """P2.11: Graceful error handler for oversized payloads."""
    if request.is_json:
        return jsonify(ok=False, error="Payload too large. Maximum size is 512 KB."), 413
    flash("The uploaded content exceeded the maximum allowed size (512 KB).", "danger")
    return safe_redirect(request.referrer, fallback='home')


# ============================================================================
# Core Route Handlers
# ============================================================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        f = request.form
        try:
            # P1.3: Validate full name is non-empty and not just whitespace
            clean_name = f.get('name', '').strip()
            if not clean_name or len(clean_name) < 2 or len(clean_name.split()) == 0:
                raise ValueError('Please provide a valid full name (at least 2 characters).')

            clean_email = f.get('email', '').strip().lower()
            if not clean_email or '@' not in clean_email or '.' not in clean_email:
                raise ValueError('Please provide a valid email address.')

            dob = datetime.date.fromisoformat(f['dob'])
            age = (datetime.date.today() - dob).days // 365
            if age < 16:
                raise ValueError('You must be at least 16 years old to create an account.')
            if len(f['password']) < 8 or f['password'] != f['confirm']:
                raise ValueError('Password must have at least 8 characters and match confirmation.')

            c = get_db()
            with c:
                c.execute('''
                    INSERT INTO users (name, email, password, dob, mobile, gender, college, year, field, created)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    clean_name,
                    clean_email,
                    generate_password_hash(f['password']),
                    f['dob'],
                    f.get('mobile', '').strip(),
                    f['gender'],
                    f['college'].strip(),
                    f['year'],
                    f['field'],
                    datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
                uid = c.execute('SELECT last_insert_rowid()').fetchone()[0]

            session['uid'] = uid
            flash(f"Welcome to {APP_NAME}, {first_name(clean_name)}! 🌱", 'success')
            return redirect(url_for('consent'))
        except (ValueError, sqlite3.IntegrityError) as e:
            if 'UNIQUE' in str(e):
                flash('An account with that email already exists. Please log in.', 'danger')
            else:
                flash(str(e), 'danger')

    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        client_ip = request.remote_addr or '127.0.0.1'

        # P2.10: Rate limiting check
        if not check_login_rate_limit(client_ip):
            flash('Too many failed login attempts. Please wait 1 minute before trying again.', 'danger')
            return render_template('login.html'), 429

        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        c = get_db()
        u = c.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

        if u and check_password_hash(u['password'], password):
            clear_login_attempts(client_ip)
            session['uid'] = u['id']
            flash(f"Welcome back, {first_name(u['name'])}! 🌿", 'success')
            return redirect(url_for('home'))

        record_failed_login(client_ip)
        flash('Invalid email or password. Please check your credentials.', 'danger')

    return render_template('login.html')


@app.route('/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    flash('You have been logged out peacefully.', 'info')
    return redirect(url_for('index'))


@app.route('/consent', methods=['GET', 'POST'])
@login_required
def consent():
    if request.method == 'POST':
        if request.form.get('c1') and request.form.get('c2'):
            c = get_db()
            with c:
                c.execute('UPDATE users SET consent = 1 WHERE id = ?', (session['uid'],))
            return redirect(url_for('survey'))
        flash('Please confirm all consent items to proceed with the baseline assessment.', 'warning')
    return render_template('consent.html')


@app.route('/survey', methods=['GET', 'POST'])
@login_required
def survey():
    u = user()
    if not u['consent']:
        return redirect(url_for('consent'))

    if request.method == 'POST':
        a = {k: request.form.get(k, '').strip() for k, _, _, _ in QUESTIONS}

        # P1.4: Strict validation of survey answers against allowed options
        for key, label_text, qtype, opts in QUESTIONS:
            val = a.get(key, '')
            if key != 'health' and not val:
                flash(f"Please provide an answer for '{label_text}'.", 'warning')
                return redirect(url_for('survey'))
            if qtype == 'select' and opts and val:
                if val not in opts:
                    flash(f"Invalid selection for '{label_text}'. Please choose from the list.", 'danger')
                    return redirect(url_for('survey'))

        score, domains, raw = scoring(a)
        kind = 'follow-up' if latest() else 'baseline'
        c = get_db()
        with c:
            c.execute('''
                INSERT INTO surveys (user_id, kind, answers, score, domains, pss_raw, created)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                session['uid'],
                kind,
                json.dumps(a),
                score,
                json.dumps(domains),
                raw,
                datetime.datetime.now(datetime.timezone.utc).isoformat()
            ))
        flash('Wellness assessment successfully calculated!', 'success')
        return redirect(url_for('results'))

    return render_template('survey.html', questions=QUESTIONS)


@app.route('/results')
@login_required
def results():
    s = latest()
    if not s:
        return redirect(url_for('survey'))
    return render_template(
        'results.html',
        s=s,
        domains=json.loads(s['domains']),
        label=label(s['score'])
    )


@app.route('/home')
@login_required
def home():
    if not latest():
        flash('Please complete your baseline survey to unlock tailored daily activities.', 'info')
        return redirect(url_for('survey'))

    moods = {
        'Stressed': {
            'desc': 'Deadlines, exam worries, or feeling overwhelmed.',
            'icon': '🌪️',
            'image': 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=500&q=80'
        },
        'Anxious': {
            'desc': 'Racing "what-if" thoughts, restlessness, or nervous energy.',
            'icon': '🌊',
            'image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'
        },
        'Distracted': {
            'desc': 'Attention jumping between open tabs and social feeds.',
            'icon': '🦋',
            'image': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=500&q=80'
        },
        'Tired': {
            'desc': 'Drained mental batteries, eye strain, or physical fatigue.',
            'icon': '🌙',
            'image': 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=500&q=80'
        },
        'Lazy': {
            'desc': '🎬 Emoji Charades, Quick Sudoku, Cat Queens, or break sluggishness.',
            'icon': '🌱',
            'image': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80'
        }
    }
    recent_journals = get_journals()
    return render_template('home.html', moods=moods, activities=ACTIVITIES, journals=recent_journals)


@app.route('/journal', methods=['POST'])
@login_required
def save_journal():
    note = request.form.get('note', '').strip()
    tag = request.form.get('tag', 'Mindful Moment').strip()
    mood = request.form.get('mood', 'Calm').strip()
    if note:
        c = get_db()
        with c:
            c.execute('''
                INSERT INTO journals (user_id, mood, note, tag, created)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                session['uid'],
                mood[:30],
                note[:500],
                tag[:30],
                datetime.datetime.now(datetime.timezone.utc).isoformat()
            ))
        flash('Reflection recorded in your mindful journal 🌿', 'success')
    return safe_redirect(request.referrer, fallback='home')


@app.route('/recommend', methods=['GET', 'POST'])
@login_required
def recommend():
    if request.method == 'GET':
        return redirect(url_for('home'))

    # P1.6: Validate mood and normalize time from minutes to seconds
    mood = request.form.get('mood', 'Stressed')
    if mood not in ACTIVITIES:
        mood = 'Stressed'

    try:
        intensity = max(1, min(5, int(request.form.get('intensity', 3))))
    except (ValueError, TypeError):
        intensity = 3

    try:
        time_input = int(request.form.get('time', 5))
    except (ValueError, TypeError):
        time_input = 5

    time_sec = time_input * 60 if time_input <= 15 else time_input

    # Filter activities matching time limit and preserve chosen mood
    options = [x for x in ACTIVITIES.get(mood, []) if x[1] <= time_sec]
    options = options or ACTIVITIES.get(mood, []) or ACTIVITIES['Stressed']

    # P1.7: Nighttime calm bias after 9 PM in local/IST time
    local_hour = get_local_now().hour
    if local_hour >= 21:
        calm = [x for x in options if x[3] == 'calming']
        options = calm or options

    past = records()
    recent = [r['activity'] for r in past[:2]]

    # Prioritize non-repeating and calming if high intensity
    options.sort(key=lambda x: (
        x[0] in recent,
        -(x[3] == 'calming' and intensity >= 4),
        random.random()
    ))
    selected = options[0]

    return render_template(
        'recommend.html',
        mood=mood,
        intensity=intensity,
        activity=selected,
        options=options,
        time=time_input,
        help=(intensity >= 4 and mood == 'Anxious')
    )


@app.route('/play/<kind>')
@login_required
def play(kind):
    # P2.13: Sanitize and bound parameters
    mood = request.args.get('mood', 'Stressed')
    if mood not in ACTIVITIES:
        mood = 'Stressed'

    try:
        intensity = max(1, min(5, int(request.args.get('intensity', 3))))
    except (ValueError, TypeError):
        intensity = 3

    activity = next((a for a in ACTIVITIES.get(mood, []) if a[2] == kind), None)
    if not activity:
        for m_list in ACTIVITIES.values():
            for a in m_list:
                if a[2] == kind:
                    activity = a
                    break

    if not activity:
        return redirect(url_for('home'))

    # P1.7: Check today's 6-session cap using local date
    local_today = get_local_now().date().isoformat()
    count = sum(1 for r in records() if r['started'][:10] == local_today and r['score'] is not None)
    if count >= 6:
        flash("You've completed 6 mindful sessions today! Take a restful break offline. 🌿", 'info')
        return redirect(url_for('home'))

    return render_template(
        'play.html',
        activity=activity,
        mood=mood,
        intensity=intensity
    )


@app.route('/api/finish', methods=['POST'])
@login_required
def finish():
    # P1.5: Validate JSON payload format
    d = request.get_json(silent=True)
    if not isinstance(d, dict):
        return jsonify(ok=False, error="Invalid payload format: expected JSON object"), 400

    try:
        fraction = max(0.0, min(1.0, float(d.get('fraction', 0.0))))
    except (ValueError, TypeError):
        fraction = 0.0

    try:
        switches = max(0, min(500, int(d.get('switches', 0))))
    except (ValueError, TypeError):
        switches = 0

    try:
        before = max(1, min(5, int(d.get('before', 3))))
    except (ValueError, TypeError):
        before = 3

    try:
        after = max(1, min(5, int(d.get('after', 3))))
    except (ValueError, TypeError):
        after = 3

    # Server generates authoritative UTC timestamps
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    ended_iso = now_utc.isoformat()

    try:
        active_sec = max(0, min(3600, int(d.get('metrics', {}).get('active_seconds', 0))))
    except (ValueError, TypeError, AttributeError):
        active_sec = 0

    started_iso = (now_utc - datetime.timedelta(seconds=active_sec)).isoformat()

    mood = d.get('mood', 'Stressed')
    if mood not in ACTIVITIES:
        mood = 'Stressed'
    activity_name = str(d.get('activity', 'Mindful Activity'))[:80]

    # Cap metrics size to 4 KB to prevent storage exhaustion
    raw_metrics = d.get('metrics')
    if not isinstance(raw_metrics, dict):
        raw_metrics = {}
    metrics_json = json.dumps(raw_metrics)
    if len(metrics_json) > 4096:
        raw_metrics = {'note': 'Metrics payload exceeded size limit'}
        metrics_json = json.dumps(raw_metrics)

    # Engagement scoring: only counted if completion fraction is >= 30%
    score = round(max(0.0, 10.0 * fraction - min(3.0, switches * 0.5)), 1) if fraction >= 0.3 else None

    c = get_db()
    with c:
        c.execute('''
            INSERT INTO sessions (user_id, mood, intensity, activity, started, ended, fraction, switches, score, before, after, metrics)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session['uid'],
            mood,
            int(d.get('intensity', 3)),
            activity_name,
            started_iso,
            ended_iso,
            fraction,
            switches,
            score,
            before,
            after,
            metrics_json
        ))

    return jsonify(ok=True, score=score, url=url_for('dashboard'))


@app.route('/dashboard')
@login_required
def dashboard():
    s = latest()
    if not s:
        return redirect(url_for('survey'))

    rs = records()
    counted = [r for r in rs if r['score'] is not None]
    now = get_local_now()

    recent = [
        r for r in counted
        if (now.date() - datetime.date.fromisoformat(r['ended'][:10])).days < 14
    ]
    subset = recent if len(recent) >= 10 else counted[:10]
    avg = sum(r['score'] for r in subset) / len(subset) if subset else 0.0

    w = 0.5 * min(len(counted) / 10.0, 1.0)
    well = round((1.0 - w) * s['score'] + w * avg, 1)
    points = round(sum(r['score'] for r in counted), 1)

    # P1.7: Streak calculation using local dates
    days = sorted(set(r['started'][:10] for r in counted), reverse=True)
    streak = 0
    today = now.date()
    for i in range(len(days) + 1):
        target_day = (today - datetime.timedelta(days=i)).isoformat()
        if target_day in days:
            streak += 1
        elif i == 0:
            continue
        else:
            break

    level = 'Master of Calm' if points >= 700 else 'Mindful Anchor' if points >= 300 else 'Focused Explorer' if points >= 100 else 'Mindful Beginner'
    badges = []
    if counted:
        badges.append(('First Step', '🌱', 'Completed your first mindful activity.'))
    if streak >= 3:
        badges.append(('3-Day Streak', '🔥', 'Maintained 3 consecutive days of mindful breaks.'))
    if streak >= 7:
        badges.append(('7-Day Streak', '✨', 'One solid week of prioritizing student wellbeing.'))
    if len(set(r['mood'] for r in counted)) >= 5:
        badges.append(('Emotion Navigator', '🌈', 'Experienced activities across all 5 mood states.'))

    journals = get_journals()

    return render_template(
        'dashboard.html',
        s=s,
        domains=json.loads(s['domains']),
        records=rs[:12],
        journals=journals,
        well=well,
        avg=round(avg, 1),
        points=points,
        streak=streak,
        level=level,
        badges=badges,
        label=label(well)
    )


@app.route('/meditation')
@login_required
def meditation():
    return render_template('meditation.html')


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    # P2.9: Account deletion requires both confirmation text and valid account password
    if request.method == 'POST':
        if request.form.get('delete') != 'DELETE':
            flash("You must type 'DELETE' in uppercase to confirm account deletion.", 'warning')
            return redirect(url_for('settings'))

        pwd = request.form.get('password', '')
        u = user()
        if not u or not check_password_hash(u['password'], pwd):
            flash('Incorrect account password. Deletion cancelled for your security.', 'danger')
            return redirect(url_for('settings'))

        c = get_db()
        with c:
            c.execute('DELETE FROM journals WHERE user_id = ?', (session['uid'],))
            c.execute('DELETE FROM sessions WHERE user_id = ?', (session['uid'],))
            c.execute('DELETE FROM surveys WHERE user_id = ?', (session['uid'],))
            c.execute('DELETE FROM users WHERE id = ?', (session['uid'],))
        session.clear()
        flash('Your account and all associated personal records have been permanently erased.', 'info')
        return redirect(url_for('index'))

    return render_template('settings.html')


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


@app.route('/admin/export')
@login_required
def export():
    # P2.8: Guard export with email verification and admin secret key
    u = user()
    if not ADMIN_EMAIL or not u or u['email'] != ADMIN_EMAIL:
        return 'Forbidden: Admin access only.', 403

    # Require ADMIN_SECRET key if configured
    admin_key = request.args.get('key') or request.headers.get('X-Admin-Key')
    if ADMIN_SECRET and admin_key != ADMIN_SECRET:
        return 'Forbidden: Invalid Admin Security Key.', 403

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(['anonymous_user_id', 'kind', 'survey_score', 'domains', 'pss_raw', 'date'])

    c = get_db()
    for r in c.execute('SELECT * FROM surveys'):
        writer.writerow([r['user_id'], r['kind'], r['score'], r['domains'], r['pss_raw'], r['created']])

    return Response(
        out.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=anonymous_surveys.csv'}
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG') == '1')
