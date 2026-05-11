// ─── Word list ────────────────────────────────────────────────────────────────

const WORDS = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','great','between',
  'need','large','often','hand','high','place','hold','world','real','life','few',
  'open','seem','together','next','white','children','begin','walk','example','paper',
  'group','always','music','those','both','mark','book','letter','until','mile','river',
  'car','care','second','enough','girl','young','ready','above','ever','red','list',
  'feel','talk','bird','soon','body','dog','family','leave','song','door','product',
  'black','short','class','wind','question','happen','complete','ship','area','half',
  'rock','order','fire','south','problem','piece','told','knew','pass','since','top',
  'whole','king','space','heard','best','hour','better','true','during','hundred',
  'five','remember','step','early','west','ground','interest','reach','fast',
  'sing','listen','six','table','travel','less','morning','ten','simple','several',
  'vowel','toward','war','lay','against','pattern','slow','center','love','person',
  'money','serve','appear','road','map','rain','rule','pull','cold','voice','unit',
  'power','town','fine','drive','lead','cry','dark','note','wait','plan','figure',
  'star','box','noun','field','rest','correct','able','done','beauty','stood',
  'front','teach','week','final','gave','green','quick','develop','ocean','warm',
  'free','minute','strong','special','behind','clear','tail','produce','fact','street',
];

// ─── State ────────────────────────────────────────────────────────────────────

// All the info the test needs while running
const state = {
  duration:     30,   // chosen test length in seconds
  timeLeft:     30,
  timer:        null,
  started:      false,
  finished:     false,
  wordList:     [],
  curWord:      0,    // index of the word the user is on
  curChar:      0,    // index of the character inside that word
  correctWords: 0,
  totalTyped:   0,
  wrongChars:   0,
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

// Scores are saved as a JSON array in localStorage so they survive page reloads
function loadScores() {
  return JSON.parse(localStorage.getItem('typing_scores') || '[]');
}

function saveScores(scores) {
  localStorage.setItem('typing_scores', JSON.stringify(scores));
}

// Users are stored the same way
function loadUsers() {
  return JSON.parse(localStorage.getItem('typing_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('typing_users', JSON.stringify(users));
}

function currentUser() {
  return localStorage.getItem('typing_session') || 'Guest';
}

function isLoggedIn() {
  return localStorage.getItem('typing_session') !== null;
}

// ─── Word picking ─────────────────────────────────────────────────────────────

function pickWords(count) {
  count = count || 100;
  var result = [];
  for (var i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return result;
}

// ─── Build the word display ───────────────────────────────────────────────────

function buildDisplay() {
  var wrap = document.getElementById('words-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  for (var wi = 0; wi < state.wordList.length; wi++) {
    var word = state.wordList[wi];
    var wordSpan = document.createElement('span');
    wordSpan.className = 'w';
    wordSpan.dataset.wi = wi;

    for (var ci = 0; ci < word.length; ci++) {
      var charSpan = document.createElement('span');
      charSpan.className = 'ch pending';
      charSpan.textContent = word[ci];
      charSpan.dataset.wi = wi;
      charSpan.dataset.ci = ci;
      wordSpan.appendChild(charSpan);
    }

    wrap.appendChild(wordSpan);
  }

  placeCursor();
}

// ─── Cursor helpers ───────────────────────────────────────────────────────────

function getChar(wi, ci) {
  return document.querySelector('.ch[data-wi="' + wi + '"][data-ci="' + ci + '"]');
}

function setCharState(wi, ci, cls) {
  var el = getChar(wi, ci);
  if (el) el.className = 'ch ' + cls;
}

function placeCursor() {
  // Remove cursor from wherever it was
  var old = document.querySelectorAll('.ch.cursor');
  for (var i = 0; i < old.length; i++) old[i].classList.remove('cursor');

  var word = state.wordList[state.curWord];
  if (!word) return;

  var ci = Math.min(state.curChar, word.length - 1);
  var el = getChar(state.curWord, ci);
  if (el) el.classList.add('cursor');
}

// ─── Timer display ────────────────────────────────────────────────────────────

function updateTimerUI() {
  var el = document.getElementById('timer-display');
  if (el) el.textContent = state.timeLeft + 's';

  var timeEl = document.getElementById('s-time');
  if (timeEl) timeEl.textContent = state.timeLeft;
}

// ─── Live stats (shown while typing) ─────────────────────────────────────────

function updateLiveStats() {
  var elapsed = state.duration - state.timeLeft;
  if (elapsed <= 0) return;

  var wpm = Math.round(state.correctWords / (elapsed / 60));
  var acc = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.wrongChars) / state.totalTyped) * 100)
    : 100;

  var wpmEl  = document.getElementById('s-wpm');
  var accEl  = document.getElementById('s-acc');
  var wordsEl = document.getElementById('s-words');

  if (wpmEl)  wpmEl.textContent  = wpm || '—';
  if (accEl)  accEl.textContent  = state.totalTyped > 0 ? acc + '%' : '—';
  if (wordsEl) wordsEl.textContent = state.correctWords;
}

// ─── Finish the test ──────────────────────────────────────────────────────────

function finish() {
  state.finished = true;
  clearInterval(state.timer);

  var wpm = Math.round(state.correctWords / (state.duration / 60));
  var acc = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.wrongChars) / state.totalTyped) * 100)
    : 100;

  var wpmEl   = document.getElementById('res-wpm');
  var accEl   = document.getElementById('res-acc');
  var wordsEl = document.getElementById('res-words');
  var charsEl = document.getElementById('res-chars');
  var overlay = document.getElementById('result-overlay');
  var input   = document.getElementById('type-input');

  if (wpmEl)   wpmEl.textContent   = wpm;
  if (accEl)   accEl.textContent   = acc + '%';
  if (wordsEl) wordsEl.textContent = state.correctWords;
  if (charsEl) charsEl.textContent = state.totalTyped;
  if (overlay) overlay.classList.add('show');
  if (input)   input.disabled = true;

  saveScore(wpm, acc);
}

// ─── Restart ──────────────────────────────────────────────────────────────────

function restartTest() {
  clearInterval(state.timer);
  state.timeLeft    = state.duration;
  state.timer       = null;
  state.started     = false;
  state.finished    = false;
  state.curWord     = 0;
  state.curChar     = 0;
  state.correctWords = 0;
  state.totalTyped  = 0;
  state.wrongChars  = 0;
  state.wordList    = pickWords();

  buildDisplay();

  var overlay = document.getElementById('result-overlay');
  if (overlay) overlay.classList.remove('show');

  var wpmEl   = document.getElementById('s-wpm');
  var accEl   = document.getElementById('s-acc');
  var wordsEl = document.getElementById('s-words');
  var timeEl  = document.getElementById('s-time');
  var timerEl = document.getElementById('timer-display');

  if (wpmEl)   wpmEl.textContent   = '—';
  if (accEl)   accEl.textContent   = '—';
  if (wordsEl) wordsEl.textContent = '0';
  if (timeEl)  timeEl.textContent  = '—';
  if (timerEl) timerEl.textContent = '—';

  var input = document.getElementById('type-input');
  if (input) {
    input.disabled = false;
    input.value = '';
    input.focus();
  }
}

// ─── Save & display scores ────────────────────────────────────────────────────

function saveScore(wpm, acc) {
  if (!isLoggedIn()) {
    var note = document.getElementById('save-note');
    if (note) {
      note.textContent = 'Not logged in — sign in to save your scores.';
      note.style.display = 'block';
    }
    return;
  }

  var scores = loadScores();
  scores.push({
    username: currentUser(),
    wpm: wpm,
    acc: acc,
    dur: state.duration,
    date: new Date().toLocaleDateString()
  });

  // Keep only the top 100 scores sorted by WPM
  scores.sort(function(a, b) { return b.wpm - a.wpm; });
  if (scores.length > 100) scores = scores.slice(0, 100);

  saveScores(scores);
  renderLeaderboard();
  renderPersonalStats();
}

function renderLeaderboard() {
  var list = document.getElementById('leaderboard-list');
  var scoreList = document.getElementById('scores-list');
  var scores = loadScores();

  var topTen = scores.slice(0, 10);

  if (list) {
    if (topTen.length === 0) {
      list.innerHTML = '<div class="empty-scores">no scores yet — take a run to start the leaderboard.</div>';
    } else {
      list.innerHTML = topTen.map(function(s, i) {
        return '<div class="score-row">' +
          '<span class="score-rank">' + (i + 1) + '</span>' +
          '<span class="score-wpm">' + s.wpm + '</span>' +
          '<span class="score-meta">' + s.username + '<br><span class="score-dur">' + s.acc + '% · ' + s.dur + 's</span></span>' +
          '</div>';
      }).join('');
    }
  }

  if (scoreList) {
    scoreList.innerHTML = scores.slice(0, 8).map(function(s, i) {
      return '<div class="score-row">' +
        '<span class="score-rank">' + (i + 1) + '</span>' +
        '<span class="score-wpm">' + s.wpm + '</span>' +
        '<span class="score-meta">' + s.username + '<br><span class="score-dur">' + s.acc + '% · ' + s.dur + 's</span></span>' +
        '</div>';
    }).join('');
  }
}

function renderPersonalStats() {
  var name = currentUser();
  var scores = loadScores();
  var userScores = scores.filter(function(s) { return s.username === name; });

  var bestWpm = 0;
  var bestAcc = 0;
  var totalWpm = 0;

  for (var i = 0; i < userScores.length; i++) {
    if (userScores[i].wpm > bestWpm) bestWpm = userScores[i].wpm;
    if (userScores[i].acc > bestAcc) bestAcc = userScores[i].acc;
    totalWpm += userScores[i].wpm;
  }

  var avg = userScores.length > 0 ? Math.round(totalWpm / userScores.length) : 0;

  var pbWpm      = document.getElementById('pb-wpm');
  var pbMeta     = document.getElementById('pb-meta');
  var statRuns   = document.getElementById('stat-runs');
  var statAvg    = document.getElementById('stat-avg');
  var statBestAcc = document.getElementById('stat-best-acc');

  if (pbWpm)      pbWpm.textContent      = bestWpm || '—';
  if (pbMeta)     pbMeta.textContent     = userScores.length > 0 ? bestAcc + '% accuracy' : 'no runs yet';
  if (statRuns)   statRuns.textContent   = userScores.length;
  if (statAvg)    statAvg.textContent    = avg || '—';
  if (statBestAcc) statBestAcc.textContent = userScores.length > 0 ? bestAcc + '%' : '—';
}

function clearHistory() {
  saveScores([]);
  renderLeaderboard();
  renderPersonalStats();
}

// ─── Auth (login / register) ──────────────────────────────────────────────────

function registerUser(username, password) {
  if (!username || username.length < 3) return 'Username needs at least 3 characters.';
  if (!password || password.length < 4) return 'Password needs at least 4 characters.';

  var users = loadUsers();
  var exists = users.some(function(u) {
    return u.username.toLowerCase() === username.toLowerCase();
  });
  if (exists) return 'Username already taken.';

  users.push({ username: username, password: password });
  saveUsers(users);

  localStorage.setItem('typing_session', username);
  return 'Welcome, ' + username + '! You are now logged in.';
}

function loginUser(username, password) {
  var users = loadUsers();
  var found = null;

  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === username.toLowerCase() &&
        users[i].password === password) {
      found = users[i];
      break;
    }
  }

  if (!found) return 'Wrong username or password.';

  localStorage.setItem('typing_session', found.username);
  return 'Welcome back, ' + found.username + '!';
}

function logout() {
  localStorage.removeItem('typing_session');
  location.reload();
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function initTheme() {
  var saved = localStorage.getItem('typing_theme') || 'dark';
  document.documentElement.dataset.theme = saved;

  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.textContent = saved === 'light' ? '🌙' : '☀';

  btn.addEventListener('click', function() {
    var current = document.documentElement.dataset.theme;
    var next = current === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('typing_theme', next);
    btn.textContent = next === 'light' ? '🌙' : '☀';
  });
}

// ─── Mobile nav toggle ────────────────────────────────────────────────────────

function initNavToggle() {
  var btn = document.getElementById('nav-toggle');
  var nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;

  btn.addEventListener('click', function() {
    nav.classList.toggle('show');
  });

  // Close nav when clicking anywhere else on the page
  document.addEventListener('click', function(e) {
    if (!nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove('show');
    }
  });
}

// ─── Prevent space from scrolling the page ────────────────────────────────────

function stopSpaceScroll() {
  window.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
    }
  });
}

// ─── Typing input handler ─────────────────────────────────────────────────────

function handleInput(e) {
  if (state.finished) return;

  var val = e.target.value;

  // Start the timer on the first keystroke
  if (!state.started && val.length > 0) startTimer();

  // Space = submit the current word
  if (val.endsWith(' ')) {
    var typed = val.trim();
    if (!typed) { e.target.value = ''; return; }

    var word = state.wordList[state.curWord];
    if (typed === word) state.correctWords++;

    // Mark each character correct / wrong / pending
    if (word) {
      for (var ci = 0; ci < word.length; ci++) {
        var tc = typed[ci];
        state.totalTyped++;
        if (tc === undefined) {
          setCharState(state.curWord, ci, 'pending');
        } else if (tc === word[ci]) {
          setCharState(state.curWord, ci, 'correct');
        } else {
          setCharState(state.curWord, ci, 'wrong');
          state.wrongChars++;
        }
      }
    }

    state.curWord++;
    state.curChar = 0;
    e.target.value = '';

    // Add more words if we're running low
    if (state.curWord >= state.wordList.length) {
      state.wordList = state.wordList.concat(pickWords(40));
      buildDisplay();
    }

    placeCursor();

    // Scroll the next word into view
    var nextWordEl = document.querySelector('.w[data-wi="' + state.curWord + '"]');
    if (nextWordEl) nextWordEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    if (state.started) updateLiveStats();
    return;
  }

  // Update character highlights as the user types each letter
  state.curChar = val.length;
  var currentWord = state.wordList[state.curWord];
  if (currentWord) {
    for (var i = 0; i < currentWord.length; i++) {
      var typedChar = val[i];
      if (typedChar === undefined) {
        setCharState(state.curWord, i, 'pending');
      } else if (typedChar === currentWord[i]) {
        setCharState(state.curWord, i, 'correct');
      } else {
        setCharState(state.curWord, i, 'wrong');
      }
    }
  }

  placeCursor();
  if (state.started) updateLiveStats();
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function startTimer() {
  if (state.started) return;
  state.started = true;
  state.timeLeft = state.duration;
  updateTimerUI();

  state.timer = setInterval(function() {
    state.timeLeft--;
    updateTimerUI();
    updateLiveStats();
    if (state.timeLeft <= 0) finish();
  }, 1000);
}

// ─── Duration buttons ─────────────────────────────────────────────────────────

function initDurationButtons() {
  var group = document.getElementById('dur-group');
  if (!group) return;

  var buttons = group.querySelectorAll('.mode-btn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function() {
      // Clear active class from all buttons
      for (var j = 0; j < buttons.length; j++) buttons[j].classList.remove('active');
      this.classList.add('active');
      state.duration = parseInt(this.dataset.dur, 10);
      restartTest();
    });
  }
}

// ─── Page initializers ────────────────────────────────────────────────────────

function initHomePage() {
  state.wordList = pickWords();
  buildDisplay();
  renderLeaderboard();
  renderPersonalStats();
  initDurationButtons();

  var input = document.getElementById('type-input');
  if (input) {
    input.addEventListener('input', handleInput);
    input.focus();
  }

  var restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', restartTest);

  var retryBtn = document.getElementById('result-retry');
  if (retryBtn) retryBtn.addEventListener('click', restartTest);

  var clearBtn = document.getElementById('clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);

  // Show the logged-in user's name in the greeting
  var greeting = document.getElementById('user-greeting');
  if (greeting) {
    if (isLoggedIn()) {
      greeting.textContent = 'Signed in as ' + currentUser() + '. Your scores are being saved.';
    } else {
      greeting.textContent = 'Not signed in — visit the login page to save your scores.';
    }
  }
}

function initAuthPage() {
  renderLeaderboard();

  var tabs        = document.querySelectorAll('.auth-tab');
  var loginForm   = document.getElementById('login-form');
  var registerForm = document.getElementById('register-form');
  var message     = document.getElementById('auth-message');

  // Tab switching
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      this.classList.add('active');

      if (this.dataset.tab === 'login') {
        loginForm.style.display    = 'block';
        registerForm.style.display = 'none';
      } else {
        loginForm.style.display    = 'none';
        registerForm.style.display = 'block';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('login-user').value.trim();
      var password = document.getElementById('login-pass').value.trim();
      var result = loginUser(username, password);
      if (message) message.textContent = result;
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('register-user').value.trim();
      var password = document.getElementById('register-pass').value.trim();
      var result = registerUser(username, password);
      if (message) message.textContent = result;
    });
  }

  // Logout button (if present on login page)
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

function initContactPage() {
  var form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Message sent! Thanks for reaching out.');
    form.reset();
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function init() {
  initTheme();
  initNavToggle();
  stopSpaceScroll();

  var page = window.location.pathname.split('/').pop();

  if (page === 'login.html') {
    initAuthPage();
  } else if (page === 'contact.html') {
    initContactPage();
  } else {
    initHomePage(); // index.html and anything else
  }
}

document.addEventListener('DOMContentLoaded', init);
