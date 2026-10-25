import { splitExample } from "./cloze.js";
import { loadCatalog } from "./data.js";
import { buildChoices, gradeTyped, matchesQuery, shuffle } from "./logic.js";
import {
  getPhraseStat,
  getWordStat,
  isMarked,
  isPhraseMarked,
  isPhraseReview,
  isReviewWord,
  loadPrefs,
  recordAnswer,
  recordPhraseAnswer,
  resetProgress,
  savePrefs,
  summarize,
  toggleMarked,
  togglePhraseMarked,
} from "./progress.js";
import { SPEECH_FALLBACK, cancelSpeech, isSpeechSupported, primeVoices, speak } from "./speech.js";
import { escapeHtml } from "./html.js";
import { modeName, renderApp, renderEntries } from "./views.js";

const PRACTICE_MODES = ["cards", "quiz", "spell", "listen", "cloze", "phrase-cards", "phrase-quiz"];
const PHRASE_MODES = new Set(["phrase-cards", "phrase-quiz"]);
const app = document.querySelector("#app");

const state = {
  units: [],
  prefs: loadPrefs(),
  route: "home",
  query: "",
  dialog: false,
  session: null,
};

function allWords() {
  return state.units.flatMap((unit) => unit.words);
}

function unitWords() {
  if (state.prefs.unitId === "all") return allWords();
  const unit = state.units.find((item) => item.id === state.prefs.unitId);
  return unit ? unit.words : allWords();
}

function phrasePool() {
  const units = state.prefs.unitId === "all"
    ? state.units
    : state.units.filter((item) => item.id === state.prefs.unitId);
  return units.flatMap((unit) => unit.phrases || []);
}

function scopedPhrases() {
  const phrases = phrasePool();
  if (state.prefs.scope === "review") return phrases.filter((phrase) => isPhraseReview(phrase.id));
  return phrases;
}

function isPhraseMode(mode) {
  return PHRASE_MODES.has(mode);
}

function scopedWords() {
  const words = unitWords();
  if (state.prefs.scope === "review") return words.filter((word) => isReviewWord(word.id));
  return words;
}

function presentItem(item, kind) {
  const phrase = kind === "phrase";
  const stat = phrase ? getPhraseStat(item.id) : getWordStat(item.id);
  const marked = phrase ? isPhraseMarked(item.id) : isMarked(item.id);
  return { ...item, marked, correct: stat.correct, wrong: stat.wrong };
}

function presentWord(word) {
  return presentItem(word, "word");
}

function currentWord() {
  const session = state.session;
  if (!session || session.empty || session.done) return null;
  return session.queue[session.index] || null;
}

function eyebrow() {
  if (state.prefs.unitId === "all") return "全部單元";
  const unit = state.units.find((item) => item.id === state.prefs.unitId);
  if (!unit) return "全部單元";
  return [unit.level, unit.title].filter(Boolean).join(" · ");
}

function listWords() {
  return scopedWords().filter((word) => matchesQuery(word, state.query)).map(presentWord);
}

function buildVm() {
  const words = unitWords();
  const session = state.session;
  return {
    route: state.route,
    units: state.units.map((unit) => ({
      id: unit.id,
      level: unit.level,
      title: unit.title,
      count: unit.words.length,
    })),
    unitId: state.prefs.unitId,
    scope: state.prefs.scope,
    allCount: allWords().length,
    phraseCount: phrasePool().length,
    summary: summarize(words),
    speechOk: isSpeechSupported(),
    eyebrow: eyebrow(),
    query: state.query,
    listWords: state.route === "list" ? listWords() : [],
    dialog: state.dialog,
    session: session ? presentSession(session) : null,
  };
}

function presentSession(session) {
  const word = currentWord();
  const total = session.queue.length;
  const index = Math.min(session.index + 1, Math.max(total, 1));
  return {
    mode: session.mode,
    modeName: modeName(session.mode),
    index,
    total,
    percent: total ? Math.round((index / total) * 100) : 0,
    done: session.done,
    empty: session.empty,
    blocked: session.blocked,
    word: word ? presentItem(word, session.kind) : null,
    flipped: session.flipped,
    phase: session.phase,
    result: session.result,
    answer: session.answer,
    hint: session.hint,
    canPrev: session.index > 0,
    canNext: session.index < total - 1,
    choices: (session.choices || []).map((choice) => ({ ...choice, state: choiceState(session, choice.id) })),
    asked: session.asked,
    direction: session.direction,
    roundCorrect: session.roundCorrect,
    roundWrong: session.roundWrong,
    note: session.note,
    error: session.error,
    speechOk: isSpeechSupported(),
    surface: session.surface,
  };
}

function choiceState(session, id) {
  if (session.phase !== "feedback") return "";
  const word = currentWord();
  if (word && id === word.id) return "is-correct";
  if (id === session.picked) return "is-wrong";
  return "is-dim";
}

function render({ keepScroll = false } = {}) {
  const y = keepScroll ? window.scrollY : 0;
  const activeId = document.activeElement?.id;
  const selectionStart = document.activeElement?.selectionStart;
  const selectionEnd = document.activeElement?.selectionEnd;
  app.innerHTML = renderApp(buildVm());
  document.title = state.route === "home" ? "英文單字練習" : `${modeName(state.route)} · 英文單字練習`;
  if (keepScroll) window.scrollTo(0, y);
  else window.scrollTo(0, 0);
  if (keepScroll && activeId) {
    const next = document.getElementById(activeId);
    if (next) {
      next.focus();
      if (typeof selectionStart === "number" && typeof next.setSelectionRange === "function") {
        next.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
      }
    }
  }
  afterRender();
}

function afterRender() {
  if (state.dialog) {
    document.querySelector("[data-action='cancel-reset']")?.focus();
    return;
  }
  const session = state.session;
  const input = document.getElementById("answer");
  if (input && session?.phase === "ask" && document.activeElement !== input && window.matchMedia("(pointer: fine)").matches) {
    input.focus();
  }
  if (!session || session.mode !== "listen" || session.phase !== "ask" || session.empty || session.done) return;
  if (session.spokenIndex === session.index) return;
  session.spokenIndex = session.index;
  const word = currentWord();
  if (word && isSpeechSupported()) speak(word.word);
}

function announce(text) {
  const live = document.getElementById("live");
  if (live) live.textContent = text;
}

function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const known = new Set(["", "cards", "quiz", "spell", "listen", "cloze", "list", "phrase-cards", "phrase-quiz"]);
  if (!known.has(raw)) return "home";
  return raw === "" ? "home" : raw;
}

function rememberPrefs() {
  if (state.prefs.unitId !== "all" && !state.units.some((unit) => unit.id === state.prefs.unitId)) {
    state.prefs.unitId = "all";
  }
  savePrefs(state.prefs);
}

function go(route) {
  cancelSpeech();
  state.route = route;
  state.dialog = false;
  if (route === "home" || route === "list") state.session = null;
  else startSession(route);
  render();
}

function startSession(mode) {
  switch (mode) {
    case "cards":
    case "quiz":
    case "spell":
    case "listen":
    case "cloze":
    case "phrase-cards":
    case "phrase-quiz":
      break;
    default: {
      const unknown = mode;
      throw new Error(`無法開始這個模式：${String(unknown)}`);
    }
  }
  const phrase = isPhraseMode(mode);
  const pool = phrase ? scopedPhrases() : scopedWords();
  const queue = mode === "cards" || mode === "phrase-cards" ? pool.slice() : shuffle(pool);
  state.session = {
    mode,
    kind: phrase ? "phrase" : "word",
    queue,
    index: 0,
    flipped: false,
    phase: "ask",
    result: null,
    answer: "",
    hint: false,
    picked: null,
    choices: [],
    asked: state.prefs.direction === "zh-en" ? "zh-en" : "en-zh",
    direction: state.prefs.direction,
    roundCorrect: 0,
    roundWrong: 0,
    note: "",
    error: "",
    recorded: false,
    empty: queue.length === 0,
    blocked: false,
    done: false,
    surface: "",
    spokenIndex: -1,
  };
  if (!state.session.empty) prepareQuestion();
}

function askedDirection(session) {
  if (session.direction === "mix") return Math.random() < 0.5 ? "en-zh" : "zh-en";
  return session.direction === "zh-en" ? "zh-en" : "en-zh";
}

function prepareQuestion() {
  const session = state.session;
  const word = currentWord();
  session.phase = "ask";
  session.result = null;
  session.answer = "";
  session.hint = false;
  session.picked = null;
  session.error = "";
  session.recorded = false;
  session.flipped = false;
  session.blocked = false;
  session.surface = "";
  if (!word) return;
  if (session.mode === "quiz" || session.mode === "phrase-quiz") {
    session.asked = askedDirection(session);
    const pool = session.kind === "phrase" ? phrasePool() : unitWords();
    session.choices = buildChoices(word, pool, session.asked);
    session.blocked = session.choices.length < 2;
  }
  if (session.mode === "cloze") {
    const parts = splitExample(word.example, word.word);
    session.surface = parts.surface;
  }
}

function settle(ok) {
  const session = state.session;
  const word = currentWord();
  if (!session || !word || session.recorded) return;
  session.recorded = true;
  session.result = ok ? "correct" : "wrong";
  session.phase = "feedback";
  if (session.kind === "phrase") recordPhraseAnswer(word.id, ok);
  else recordAnswer(word.id, ok);
  if (ok) session.roundCorrect += 1;
  else session.roundWrong += 1;
  announce(ok ? `答對了。${word.word}` : `答錯了。正確是 ${word.word}`);
}

function checkAnswer() {
  const session = state.session;
  const word = currentWord();
  if (!session || !word || session.phase !== "ask") return;
  const input = document.getElementById("answer");
  if (input) session.answer = input.value;
  const accepted = session.mode === "cloze" && session.surface
    ? [session.surface, word.word]
    : [word.word];
  const graded = gradeTyped(accepted, session.answer);
  if (graded.empty) {
    session.error = "請先輸入英文。";
    render({ keepScroll: true });
    document.getElementById("answer")?.focus();
    return;
  }
  settle(graded.ok);
  render({ keepScroll: true });
}

function revealAnswer() {
  const session = state.session;
  if (!session || session.phase !== "ask") return;
  settle(false);
  render({ keepScroll: true });
}

function nextQuestion() {
  const session = state.session;
  if (!session) return;
  if (session.index + 1 >= session.queue.length) {
    session.done = true;
    cancelSpeech();
    render();
    announce("這一輪練完了");
    return;
  }
  session.index += 1;
  session.note = "";
  prepareQuestion();
  render();
}

function onScope(value) {
  state.prefs.scope = value === "review" ? "review" : "all";
  rememberPrefs();
  render({ keepScroll: true });
}

function onUnit(unitId) {
  state.prefs.unitId = unitId;
  rememberPrefs();
  render({ keepScroll: true });
}

function onDirection(value) {
  const allowed = ["en-zh", "zh-en", "mix"];
  if (!allowed.includes(value)) return;
  state.prefs.direction = value;
  rememberPrefs();
  if (state.session) {
    state.session.direction = value;
    if (state.session.phase === "ask" && state.session.mode === "quiz") prepareQuestion();
  }
  render({ keepScroll: true });
}

function onMark(wordId) {
  if (!wordId) return;
  const phrase = state.session?.kind === "phrase";
  const marked = phrase ? togglePhraseMarked(wordId) : toggleMarked(wordId);
  announce(marked ? "已標記不熟" : "已取消不熟");
  render({ keepScroll: true });
}

function onSpeak(text, rate) {
  const numeric = Number(rate);
  const safeRate = Number.isFinite(numeric) && numeric > 0 ? numeric : 0.92;
  const ok = speak(text, { rate: safeRate });
  if (!ok) announce(SPEECH_FALLBACK);
}

function handleAction(action, element) {
  const session = state.session;
  switch (action) {
    case "scope":
      onScope(element.dataset.value);
      break;
    case "direction":
      onDirection(element.dataset.value);
      break;
    case "open-reset":
      state.dialog = true;
      render({ keepScroll: true });
      break;
    case "cancel-reset":
      state.dialog = false;
      render({ keepScroll: true });
      break;
    case "confirm-reset":
      resetProgress();
      state.dialog = false;
      announce("已清除練習紀錄");
      render();
      break;
    case "speak":
      onSpeak(element.dataset.text, Number(element.dataset.rate));
      break;
    case "replay": {
      const word = currentWord();
      if (word) onSpeak(word.word, 0.92);
      break;
    }
    case "mark":
      onMark(element.dataset.id);
      break;
    case "flip":
      if (session) {
        session.flipped = !session.flipped;
        session.note = "";
        render({ keepScroll: true });
      }
      break;
    case "prev":
      if (session && session.index > 0) {
        session.index -= 1;
        session.note = "";
        prepareQuestion();
        render();
      }
      break;
    case "next":
      if (session && session.index < session.queue.length - 1) {
        session.index += 1;
        session.note = "";
        prepareQuestion();
        render();
      }
      break;
    case "shuffle":
      if (session) {
        session.queue = shuffle(session.queue);
        session.index = 0;
        session.note = "已打亂順序";
        prepareQuestion();
        render();
      }
      break;
    case "restart-cards":
      if (session) {
        session.index = 0;
        session.note = "";
        prepareQuestion();
        render();
      }
      break;
    case "pick":
      if (session && session.phase === "ask") {
        session.picked = element.dataset.id;
        settle(element.dataset.id === currentWord()?.id);
        render({ keepScroll: true });
      }
      break;
    case "hint":
      if (session) {
        session.hint = true;
        render({ keepScroll: true });
      }
      break;
    case "reveal":
      revealAnswer();
      break;
    case "next-question":
      nextQuestion();
      break;
    case "again":
      if (PRACTICE_MODES.includes(state.route)) startSession(state.route);
      render();
      break;
    default: {
      const unknown = action;
      throw new Error(`未知操作：${String(unknown)}`);
    }
  }
}

function onClick(event) {
  if (event.target.classList?.contains("modal-back")) {
    state.dialog = false;
    render({ keepScroll: true });
    return;
  }
  const element = event.target.closest("[data-action]");
  if (!element || !app.contains(element)) return;
  handleAction(element.dataset.action, element);
}

function onChange(event) {
  if (event.target.id === "unit-select") onUnit(event.target.value);
}

function onInput(event) {
  if (event.target.id === "answer" && state.session) {
    state.session.answer = event.target.value;
    state.session.error = "";
    document.getElementById("form-error")?.remove();
    return;
  }
  if (event.target.id === "search") {
    state.query = event.target.value;
    const list = document.querySelector("#word-list");
    const count = document.querySelector("#list-count");
    const words = listWords();
    if (list) list.innerHTML = renderEntries(words);
    if (count) count.textContent = `${words.length} 個，範圍是${state.prefs.scope === "review" ? "不熟與答錯" : "全部單字"}。`;
  }
}

function onSubmit(event) {
  if (!(event.target instanceof HTMLFormElement)) return;
  event.preventDefault();
  checkAnswer();
}

function onKey(event) {
  if (event.key === "Escape" && state.dialog) {
    state.dialog = false;
    render({ keepScroll: true });
    return;
  }
  const session = state.session;
  if (!session || session.done || session.empty || state.dialog) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (session.mode !== "cards" && session.mode !== "phrase-cards") return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    handleAction("next", app);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    handleAction("prev", app);
  } else if (event.key === " " && tag !== "BUTTON" && tag !== "A") {
    event.preventDefault();
    handleAction("flip", app);
  } else if (event.key === "s" || event.key === "S") {
    const word = currentWord();
    if (word) onSpeak(word.word, 0.92);
  } else if (event.key === "m" || event.key === "M") {
    const word = currentWord();
    if (word) onMark(word.id);
  }
}

function renderFatal(error) {
  const message = error instanceof Error ? error.message : "發生不明錯誤。";
  app.innerHTML = `<main class="stack fatal">
    <h1>單字載入失敗</h1>
    <p>${escapeHtml(message)}</p>
  </main>`;
}

async function boot() {
  app.innerHTML = `<main class="stack"><p class="lede">單字載入中…</p></main>`;
  try {
    state.units = await loadCatalog();
  } catch (error) {
    renderFatal(error);
    return;
  }
  primeVoices();
  state.prefs = loadPrefs();
  rememberPrefs();
  window.addEventListener("hashchange", () => go(currentRoute()));
  document.addEventListener("keydown", onKey);
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", onInput);
  app.addEventListener("submit", onSubmit);
  go(currentRoute());
}

boot();
