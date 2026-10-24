const PROGRESS_KEY = "evp.progress.v1";
const PREFS_KEY = "evp.prefs.v1";

let memory = null;

function emptyProgress() {
  return { stats: {}, marked: {} };
}

function read() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : emptyProgress();
    if (!parsed || typeof parsed !== "object" || typeof parsed.stats !== "object" || typeof parsed.marked !== "object") {
      memory = emptyProgress();
    } else {
      memory = { stats: parsed.stats, marked: parsed.marked };
    }
  } catch {
    memory = emptyProgress();
  }
  return memory;
}

function write() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(read()));
  } catch {
    // Private mode can reject storage; keep the in-memory copy for this visit.
  }
}

export function getWordStat(wordId) {
  const stat = read().stats[wordId];
  return {
    correct: stat?.correct || 0,
    wrong: stat?.wrong || 0,
  };
}

export function isMarked(wordId) {
  return Boolean(read().marked[wordId]);
}

export function isReviewWord(wordId) {
  if (isMarked(wordId)) return true;
  const stat = getWordStat(wordId);
  return stat.wrong > stat.correct;
}

export function recordAnswer(wordId, correct) {
  const data = read();
  const current = data.stats[wordId] || { correct: 0, wrong: 0 };
  if (correct) current.correct += 1;
  else current.wrong += 1;
  data.stats[wordId] = current;
  write();
  return { correct: current.correct, wrong: current.wrong };
}

export function toggleMarked(wordId) {
  const data = read();
  if (data.marked[wordId]) delete data.marked[wordId];
  else data.marked[wordId] = true;
  write();
  return Boolean(data.marked[wordId]);
}

export function resetProgress() {
  memory = emptyProgress();
  write();
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
