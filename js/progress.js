const WORD_KEY = "evp.progress.v1";
const PHRASE_KEY = "evp.phrase-progress.v1";
const PREFS_KEY = "evp.prefs.v1";

const caches = {
  [WORD_KEY]: null,
  [PHRASE_KEY]: null,
};

function emptyProgress() {
  return { stats: {}, marked: {} };
}

function read(key) {
  if (caches[key]) return caches[key];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : emptyProgress();
    if (!parsed || typeof parsed !== "object" || typeof parsed.stats !== "object" || typeof parsed.marked !== "object") {
      caches[key] = emptyProgress();
    } else {
      caches[key] = { stats: parsed.stats, marked: parsed.marked };
    }
  } catch {
    caches[key] = emptyProgress();
  }
  return caches[key];
}

function write(key) {
  try {
    localStorage.setItem(key, JSON.stringify(read(key)));
  } catch {
    // Private mode can reject storage; keep the in-memory copy for this visit.
  }
}

function statOf(key, itemId) {
  const stat = read(key).stats[itemId];
  return {
    correct: stat?.correct || 0,
    wrong: stat?.wrong || 0,
  };
}

function markedOf(key, itemId) {
  return Boolean(read(key).marked[itemId]);
}

function reviewOf(key, itemId) {
  if (markedOf(key, itemId)) return true;
  const stat = statOf(key, itemId);
  return stat.wrong > stat.correct;
}

function recordOf(key, itemId, correct) {
  const data = read(key);
  const current = data.stats[itemId] || { correct: 0, wrong: 0 };
  if (correct) current.correct += 1;
  else current.wrong += 1;
  data.stats[itemId] = current;
  write(key);
  return { correct: current.correct, wrong: current.wrong };
}

function toggleOf(key, itemId) {
  const data = read(key);
  if (data.marked[itemId]) delete data.marked[itemId];
  else data.marked[itemId] = true;
  write(key);
  return Boolean(data.marked[itemId]);
}

export function getWordStat(wordId) {
  return statOf(WORD_KEY, wordId);
}

export function isMarked(wordId) {
  return markedOf(WORD_KEY, wordId);
}

export function isReviewWord(wordId) {
  return reviewOf(WORD_KEY, wordId);
}

export function recordAnswer(wordId, correct) {
  return recordOf(WORD_KEY, wordId, correct);
}

export function toggleMarked(wordId) {
  return toggleOf(WORD_KEY, wordId);
}

export function getPhraseStat(phraseId) {
  return statOf(PHRASE_KEY, phraseId);
}

export function isPhraseMarked(phraseId) {
  return markedOf(PHRASE_KEY, phraseId);
}

export function isPhraseReview(phraseId) {
  return reviewOf(PHRASE_KEY, phraseId);
}

export function recordPhraseAnswer(phraseId, correct) {
  return recordOf(PHRASE_KEY, phraseId, correct);
}

export function togglePhraseMarked(phraseId) {
  return toggleOf(PHRASE_KEY, phraseId);
}

export function resetProgress() {
  caches[WORD_KEY] = emptyProgress();
  caches[PHRASE_KEY] = emptyProgress();
  write(WORD_KEY);
  write(PHRASE_KEY);
}

export function summarize(words) {
  let correct = 0;
  let wrong = 0;
  let marked = 0;
  let review = 0;
  for (const word of words) {
    const stat = getWordStat(word.id);
    correct += stat.correct;
    wrong += stat.wrong;
    if (isMarked(word.id)) marked += 1;
    if (isReviewWord(word.id)) review += 1;
  }
  const answered = correct + wrong;
  return {
    correct,
    wrong,
    answered,
    marked,
    review,
    total: words.length,
    rate: answered ? Math.round((correct / answered) * 100) : null,
  };
}

export function loadPrefs() {
  const fallback = { unitId: "all", scope: "all", direction: "en-zh" };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const direction = ["en-zh", "zh-en", "mix"].includes(parsed.direction) ? parsed.direction : "en-zh";
    return {
      unitId: typeof parsed.unitId === "string" ? parsed.unitId : "all",
      scope: parsed.scope === "review" ? "review" : "all",
      direction,
    };
  } catch {
    return fallback;
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage failures; the current visit still keeps prefs in memory.
  }
}
