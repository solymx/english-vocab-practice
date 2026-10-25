export function shuffle(list, random = Math.random) {
  const copy = list.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

export function normalizeAnswer(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "")
    .replace(/\s+/g, " ");
}

export function gradeTyped(accepted, raw) {
  const answer = normalizeAnswer(raw);
  if (!answer) return { ok: false, empty: true, answer };
  const forms = accepted.map((form) => normalizeAnswer(form));
  return { ok: forms.includes(answer), empty: false, answer };
}

export function buildChoices(correct, pool, direction, random = Math.random) {
  const labelOf = (word) => (direction === "en-zh" ? word.zh : word.word);
  const correctLabel = labelOf(correct);
  const others = pool.filter((word) => word.id !== correct.id && labelOf(word) !== correctLabel);
  const picked = shuffle(others, random).slice(0, 3);
  return shuffle([correct, ...picked], random).map((word) => ({
    id: word.id,
    label: labelOf(word),
    pos: word.pos,
  }));
}

export function matchesQuery(word, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const related = (word.related || []).map((item) => `${item.word} ${item.zh}`).join(" ");
  const haystack = [word.word, word.zh, word.pos, word.example, word.exampleZh, word.notes || "", related]
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}
