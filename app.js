// keyflow — app.js

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
  'north','open','seem','together','next','white','children','begin','got','walk',
  'example','ease','paper','group','always','music','those','both','mark','book',
  'letter','until','mile','river','car','feet','care','second','enough','plain',
  'girl','usual','young','ready','above','ever','red','list','though','feel','talk',
  'bird','soon','body','dog','family','direct','pose','leave','song','measure',
  'door','product','black','short','numeral','class','wind','question','happen',
  'complete','ship','area','half','rock','order','fire','south','problem','piece',
  'told','knew','pass','since','top','whole','king','space','heard','best','hour',
  'better','true','during','hundred','five','remember','step','early','hold','west',
  'ground','interest','reach','fast','verb','sing','listen','six','table','travel',
  'less','morning','ten','simple','several','vowel','toward','war','lay','against',
  'pattern','slow','center','love','person','money','serve','appear','road','map',
  'rain','rule','govern','pull','cold','notice','voice','unit','power','town','fine',
  'drive','lead','cry','dark','machine','note','wait','plan','figure','star','box',
  'noun','field','rest','correct','able','pound','done','beauty','stood','contain',
  'front','teach','week','final','gave','green','oh','quick','develop','ocean','warm',
  'free','minute','strong','special','behind','clear','tail','produce','fact','street',
  'inch','multiply','nothing','course','stay','wheel','full','force','blue','object',
  'decide','surface','deep','moon','island','foot','system','busy','test','record',
  'boat','common','gold','possible','plane','dry','wonder','laugh','thousand','ago',
  'ran','check','game','shape','equate','miss','brought','heat','snow','tire','bring',
  'yes','distant','fill','east','paint','language','among',
];

const STORAGE = {
  users: JSON.parse(localStorage.getItem('typing_users') || '[]'),
  scores: JSON.parse(localStorage.getItem('typing_scores') || '[]'),
  session: localStorage.getItem('typing_session') || null,
};

const state = {
  duration: 30,
  timeLeft: 30,
  timer: null,
  started: false,
  finished: false,
  wordList: [],
  curWord: 0,
  curChar: 0,
  correctWords: 0,
  totalTyped: 0,
  wrongChars: 0,
  weakWords: [],
  customText: null,
  suffix: '',
};

function saveStorage() {
  localStorage.setItem('typing_users', JSON.stringify(STORAGE.users));
  localStorage.setItem('typing_scores', JSON.stringify(STORAGE.scores));
}

function currentUser() {
  return STORAGE.session || 'Guest';
}

function isLoggedIn() {
  return !!STORAGE.session;
}

function pickWords(n = 140) {
  return Array.from({ length: n }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
}

function parseCustomText(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 180);
}

function getId(id) {
  return document.getElementById(state.suffix + id);
}

function buildDisplay() {
  const wrap = getId('words-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  state.wordList.forEach((word, wi) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.dataset.wi = wi;

    word.split('').forEach((ch, ci) => {
      const s = document.createElement('span');
      s.className = 'ch pending';
      s.textContent = ch;
      s.dataset.wi = wi;
      s.dataset.ci = ci;
      span.appendChild(s);
    });

    wrap.appendChild(span);
  });

  placeCursor();
}

function getChar(wi, ci) {
  return document.querySelector(`.ch[data-wi="${wi}"][data-ci="${ci}"]`);
}

function setCharState(wi, ci, cls) {
  const el = getChar(wi, ci);
  if (el) el.className = 'ch ' + cls;
}

function placeCursor() {
  document.querySelectorAll('.ch.cursor').forEach(el => el.classList.remove('cursor'));
  const word = state.wordList[state.curWord];
  if (!word) return;
  const ci = Math.min(state.curChar, word.length - 1);
  const el = getChar(state.curWord, ci);
  if (el) el.classList.add('cursor');
}

function updateTimerUI() {
  const timerEl = getId('timer-display');
  if (timerEl) timerEl.textContent = state.timeLeft + 's';
  const timeStatus = getId('s-time');
  if (timeStatus) timeStatus.textContent = state.timeLeft;
}

function updateLiveStats() {
  const elapsed = state.duration - state.timeLeft;
  if (elapsed <= 0) return;

  const wpm = Math.round(state.correctWords / (elapsed / 60));
  const acc = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.wrongChars) / state.totalTyped) * 100)
    : 100;

  const wpmEl = getId('s-wpm');
  const accEl = getId('s-acc');
  const wordsEl = getId('s-words');

  if (wpmEl) wpmEl.textContent = wpm || '—';
  if (accEl) accEl.textContent = state.totalTyped > 0 ? acc + '%' : '—';
  if (wordsEl) wordsEl.textContent = state.correctWords;
}

function finish() {
  state.finished = true;
  clearInterval(state.timer);

  const wpm = Math.round(state.correctWords / (state.duration / 60));
  const acc = state.totalTyped > 0
    ? Math.round(((state.totalTyped - state.wrongChars) / state.totalTyped) * 100)
    : 100;

  const wpmEl = getId('res-wpm');
  const accEl = getId('res-acc');
  const wordsEl = getId('res-words');
  const charsEl = getId('res-chars');
  const overlay = getId('result-overlay');
  const input = getId('type-input');

  if (wpmEl) wpmEl.textContent = wpm;
  if (accEl) accEl.textContent = acc + '%';
  if (wordsEl) wordsEl.textContent = state.correctWords;
  if (charsEl) charsEl.textContent = state.totalTyped;
  if (overlay) overlay.classList.add('show');
  if (input) input.disabled = true;

  saveScore(wpm, acc, state.duration);
  renderWeakWords();
}

function restartTest(custom = false) {
  clearInterval(state.timer);
  state.timeLeft = state.duration;
  state.timer = null;
  state.started = false;
  state.finished = false;
  state.curWord = 0;
  state.curChar = 0;
  state.correctWords = 0;
  state.totalTyped = 0;
  state.wrongChars = 0;

  if (state.customText) {
    state.wordList = parseCustomText(state.customText);
  } else {
    state.wordList = pickWords();
  }

  buildDisplay();
  renderWeakWords();
  const overlay = getId('result-overlay');
  if (overlay) overlay.classList.remove('show');

  const input = getId('type-input');
  if (input) {
    input.disabled = false;
    input.value = '';
    input.focus();
  }

  const input2 = getId('custom-type-input');
  if (input2) {
    input2.disabled = !state.customText;
    if (!state.customText) input2.value = '';
  }

  const wpmEl = getId('s-wpm');
  const accEl = getId('s-acc');
  const wordsEl = getId('s-words');
  const timeEl = getId('s-time');

  if (wpmEl) wpmEl.textContent = '—';
  if (accEl) accEl.textContent = '—';
  if (wordsEl) wordsEl.textContent = '0';
  if (timeEl) timeEl.textContent = '—';
  const timerEl = getId('timer-display');
  if (timerEl) timerEl.textContent = '—';
}

function saveScore(wpm, acc, dur) {
  if (!isLoggedIn()) {
    const note = getId('save-note');
    if (note) note.textContent = 'You are not logged in. Register or sign in to save results.';
    return;
  }

  const username = currentUser();
  STORAGE.scores.push({ username, wpm, acc, dur, date: new Date().toLocaleDateString() });
  STORAGE.scores.sort((a, b) => b.wpm - a.wpm || b.acc - a.acc);
  if (STORAGE.scores.length > 100) STORAGE.scores = STORAGE.scores.slice(0, 100);
  saveStorage();
  renderLeaderboard();
  renderPersonalStats();
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  const scoreList = document.getElementById('scores-list');
  if (list) {
    list.innerHTML = STORAGE.scores.slice(0, 10).map((s, i) => `
      <div class="score-row">
        <span class="score-rank">${i + 1}</span>
        <span class="score-wpm">${s.wpm}</span>
        <span class="score-meta">${s.username}<br><span class="score-dur">${s.acc}% · ${s.dur}s</span></span>
      </div>
    `).join('') || '<div class="empty-scores">no scores yet — take a run to start the leaderboard.</div>';
  }

  if (scoreList) {
    scoreList.innerHTML = STORAGE.scores.slice(0, 8).map((s, i) => `
      <div class="score-row">
        <span class="score-rank">${i + 1}</span>
        <span class="score-wpm">${s.wpm}</span>
        <span class="score-meta">${s.username}<br><span class="score-dur">${s.acc}% · ${s.dur}s</span></span>
      </div>
    `).join('');
  }
}

function renderPersonalStats() {
  const name = currentUser();
  const userScores = STORAGE.scores.filter(s => s.username === name);
  const best = userScores.reduce((max, s) => Math.max(max, s.wpm), 0);
  const bestAcc = userScores.reduce((max, s) => Math.max(max, s.acc), 0);
  const avg = userScores.length ? Math.round(userScores.reduce((sum, s) => sum + s.wpm, 0) / userScores.length) : '—';

  const pbWpm = document.getElementById('pb-wpm');
  const pbMeta = document.getElementById('pb-meta');
  const statRuns = document.getElementById('stat-runs');
  const statAvg = document.getElementById('stat-avg');
  const statBestAcc = document.getElementById('stat-best-acc');

  if (pbWpm) pbWpm.textContent = best || '—';
  if (pbMeta) pbMeta.textContent = userScores.length ? `${bestAcc}% accuracy · ${userScores[0].dur}s` : 'no runs yet';
  if (statRuns) statRuns.textContent = userScores.length;
  if (statAvg) statAvg.textContent = avg;
  if (statBestAcc) statBestAcc.textContent = userScores.length ? bestAcc + '%' : '—';
}

function renderWeakWords() {
  const wrapper = getId('weak-words-list');
  if (!wrapper) return;
  if (!state.weakWords.length) {
    wrapper.innerHTML = 'Finish a session to generate a focused word list.';
    return;
  }

  wrapper.innerHTML = state.weakWords.slice(0, 12).map(word => `
    <span class="weak-word-tag">${word}</span>
  `).join('');
}

function practiceWeakWords() {
  if (!state.weakWords.length) return;
  state.wordList = [...new Set(state.weakWords)];
  state.duration = 30;
  restartTest();
}

function clearHistory() {
  STORAGE.scores = [];
  saveStorage();
  renderLeaderboard();
  renderPersonalStats();
  const note = getId('save-note');
  if (note) note.textContent = 'History cleared. Sign in to save fresh runs.';
}

function renderAuthProfile() {
  const profileName = document.getElementById('profile-name');
  const profileMeta = document.getElementById('profile-meta');
  const profileBest = document.getElementById('profile-best');
  const profileRuns = document.getElementById('profile-runs');
  const profileAcc = document.getElementById('profile-acc');

  const user = currentUser();
  const userScores = STORAGE.scores.filter(s => s.username === user);
  const best = userScores.reduce((max, s) => Math.max(max, s.wpm), 0);
  const bestAcc = userScores.reduce((max, s) => Math.max(max, s.acc), 0);

  if (profileName) profileName.textContent = user;
  if (profileMeta) profileMeta.textContent = isLoggedIn() ? 'currently signed in' : 'guest session';
  if (profileBest) profileBest.textContent = best || '—';
  if (profileRuns) profileRuns.textContent = userScores.length;
  if (profileAcc) profileAcc.textContent = userScores.length ? bestAcc + '%' : '—';
}

function renderUserGreeting() {
  const greeting = document.getElementById('user-greeting');
  if (!greeting) return;
  if (isLoggedIn()) {
    greeting.textContent = `Signed in as ${currentUser()}. Your progress is being saved to the leaderboard.`;
  } else {
    greeting.textContent = 'Not signed in yet — visit login to save your runs and compete with other users.';
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('typing_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀';
}

function initTheme() {
  const saved = localStorage.getItem('typing_theme') || 'dark';
  setTheme(saved);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initNavToggle() {
  const btn = document.getElementById('nav-toggle');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => nav.classList.toggle('show'));
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove('show');
    }
  });
}

function stopSpaceScroll() {
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
      e.preventDefault();
    }
  });
}

function handleInput(e) {
  if (state.finished) return;
  const val = e.target.value;
  if (!state.started && val.length > 0) startTimer();

  if (val.endsWith(' ')) {
    const typed = val.trim();
    if (!typed.length) { e.target.value = ''; return; }

    const word = state.wordList[state.curWord];
    const correct = typed === word;
    if (correct) state.correctWords++;
    if (!correct && word && !state.weakWords.includes(word)) state.weakWords.push(word);

    if (word) {
      word.split('').forEach((_, ci) => {
        const tc = typed[ci];
        if (tc === undefined) setCharState(state.curWord, ci, 'pending');
        else if (tc === word[ci]) setCharState(state.curWord, ci, 'correct');
        else { setCharState(state.curWord, ci, 'wrong'); state.wrongChars++; }
      });
    }

    state.curWord++;
    state.curChar = 0;
    e.target.value = '';

    if (state.curWord >= state.wordList.length) {
      state.wordList = [...state.wordList, ...pickWords(40)];
      buildDisplay();
    }

    placeCursor();
    document.querySelector(`.w[data-wi="${state.curWord}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (state.started) updateLiveStats();
    return;
  }

  state.curChar = val.length;
  const word = state.wordList[state.curWord];
  if (word) {
    word.split('').forEach((_, ci) => {
      const tc = val[ci];
      if (tc === undefined) setCharState(state.curWord, ci, 'pending');
      else if (tc === word[ci]) setCharState(state.curWord, ci, 'correct');
      else setCharState(state.curWord, ci, 'wrong');
    });
  }

  placeCursor();
}

function handleKeydown(e) {
  // Disable the previous undo-word behavior so backspace only removes a single character.
}

function handleKeyVisualizerDown(e) {
  const key = e.key === ' ' ? ' ' : e.key;
  document.querySelectorAll(`.key[data-key="${CSS.escape(key)}"]`).forEach(k => k.classList.add('pressed'));
}

function handleKeyVisualizerUp(e) {
  const key = e.key === ' ' ? ' ' : e.key;
  document.querySelectorAll(`.key[data-key="${CSS.escape(key)}"]`).forEach(k => k.classList.remove('pressed'));
}

function initDurationButtons() {
  const durGroup = document.getElementById('dur-group');
  if (!durGroup) return;
  durGroup.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      durGroup.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.duration = parseInt(btn.dataset.dur, 10);
      restartTest();
    });
  });
}

function startTimer() {
  if (state.started) return;
  state.started = true;
  state.timeLeft = state.duration;
  updateTimerUI();

  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    updateLiveStats();
    if (state.timeLeft <= 0) finish();
  }, 1000);
}

function initHomePage() {
  state.customText = null;
  state.suffix = '';
  state.wordList = pickWords();
  state.weakWords = [];
  buildDisplay();
  renderWeakWords();
  renderLeaderboard();
  renderPersonalStats();
  renderUserGreeting();
  initDurationButtons();

  const input = getId('type-input');
  if (input) {
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeydown);
    input.focus();
  }

  const restart = document.getElementById('restart-btn');
  if (restart) restart.addEventListener('click', () => restartTest());
  const retry = document.getElementById('result-retry');
  if (retry) retry.addEventListener('click', () => restartTest());
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);
  const weakBtn = document.getElementById('practice-weak-btn');
  if (weakBtn) weakBtn.addEventListener('click', practiceWeakWords);
}

function initAuthPage() {
  renderLeaderboard();
  renderAuthProfile();

  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const message = document.getElementById('auth-message');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        if (message) message.textContent = 'Enter your username and password to sign in.';
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        if (message) message.textContent = 'Choose a username and password to register.';
      }
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value.trim();
      const result = loginUser(username, password);
      if (message) message.textContent = result;
      renderAuthProfile();
      renderUserGreeting();
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('register-user').value.trim();
      const password = document.getElementById('register-pass').value.trim();
      const result = registerUser(username, password);
      if (message) message.textContent = result;
      renderAuthProfile();
      renderUserGreeting();
    });
  }
}

function initCustomPage() {
  state.suffix = 'custom-';
  state.customText = null;
  state.duration = parseInt(document.getElementById('custom-duration')?.value || '30', 10);
  const input = document.getElementById('custom-type-input');
  const loadButton = document.getElementById('load-custom-btn');
  const fileInput = document.getElementById('custom-file');
  const shareBlock = document.getElementById('share-block');
  const shareNote = document.getElementById('share-note');
  const shareLinkBtn = document.getElementById('share-link-btn');

  if (loadButton) {
    loadButton.addEventListener('click', () => {
      const text = document.getElementById('custom-text-input').value.trim();
      if (!text) return alert('Please paste or upload some text first.');
      loadCustomText(text);
      if (shareBlock) shareBlock.style.display = 'block';
      if (shareNote) shareNote.textContent = 'Custom text loaded. Share this URL with anyone to challenge them.';
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        document.getElementById('custom-text-input').value = text;
      };
      reader.readAsText(file);
    });
  }

  if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', () => {
      const text = state.customText || document.getElementById('custom-text-input').value.trim();
      if (!text) return alert('Load some text before sharing.');
      const encoded = encodeURIComponent(text);
      const url = `${window.location.origin}${window.location.pathname}?text=${encoded}`;
      navigator.clipboard.writeText(url).then(() => alert('Share link copied!'));
    });
  }

  const params = new URLSearchParams(window.location.search);
  const sharedText = params.get('text');
  if (sharedText) {
    const decoded = decodeURIComponent(sharedText);
    document.getElementById('custom-text-input').value = decoded;
    loadCustomText(decoded);
    if (shareBlock) shareBlock.style.display = 'block';
    if (shareNote) shareNote.textContent = 'This custom test came from a shared link.';
  }

  if (input) {
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeydown);
  }

  const retry = document.getElementById('custom-result-retry');
  if (retry) retry.addEventListener('click', () => restartTest());
}

function loadCustomText(text) {
  state.customText = text;
  state.duration = parseInt(document.getElementById('custom-duration')?.value || '30', 10);
  restartTest(true);
  const input = document.getElementById('custom-type-input');
  if (input) {
    input.disabled = false;
    input.placeholder = 'Start typing your custom text here...';
    input.focus();
  }
}

function registerUser(username, password) {
  if (!username || username.length < 3) return 'Username needs at least 3 characters.';
  if (!password || password.length < 4) return 'Password needs at least 4 characters.';
  if (STORAGE.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return 'Username already exists.';
  STORAGE.users.push({ username, password });
  saveStorage();
  STORAGE.session = username;
  localStorage.setItem('typing_session', username);
  return `Welcome, ${username}! You are now logged in.`;
}

function loginUser(username, password) {
  const user = STORAGE.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) return 'Login failed. Check username and password.';
  STORAGE.session = user.username;
  localStorage.setItem('typing_session', user.username);
  return `Welcome back, ${user.username}!`;
}

function init() {
  initTheme();
  initNavToggle();
  initSmoothScroll();
  stopSpaceScroll();
  renderLeaderboard();
  renderUserGreeting();

  const path = window.location.pathname.split('/').pop();
  if (path === 'login.html') {
    initAuthPage();
  } else if (path === 'custom.html') {
    initCustomPage();
  } else {
    initHomePage();
  }

  document.addEventListener('keydown', handleKeyVisualizerDown);
  document.addEventListener('keyup', handleKeyVisualizerUp);
}

document.addEventListener('DOMContentLoaded', init);
