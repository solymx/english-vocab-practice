function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildForms(word) {
  const w = String(word).toLowerCase();
  const forms = new Set([w, `${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}d`, `${w}'s`]);

  if (w.endsWith("e") && !w.endsWith("ee")) {
    const stem = w.slice(0, -1);
    forms.add(`${stem}ing`);
    forms.add(`${stem}ed`);
  }

  if (w.length > 2 && w.endsWith("y") && !"aeiou".includes(w[w.length - 2])) {
    const stem = w.slice(0, -1);
    forms.add(`${stem}ies`);
    forms.add(`${stem}ied`);
  }

  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(w)) {
    const doubled = `${w}${w[w.length - 1]}`;
    forms.add(`${doubled}ed`);
    forms.add(`${doubled}ing`);
  }

  return [...forms];
}

export function findBlank(sentence, word) {
  const forms = buildForms(word).sort((a, b) => b.length - a.length);
  for (const form of forms) {
    const pattern = new RegExp(`(^|[^A-Za-z])(${escapeRegExp(form)})(?![A-Za-z])`, "i");
    const match = pattern.exec(sentence);
    if (!match) continue;
    const surface = match[2];
    return {
      index: match.index + match[1].length,
      length: surface.length,
      surface,
    };
  }
  return null;
}

export function splitExample(sentence, word) {
  const found = findBlank(sentence, word);
  if (!found) {
    return { before: sentence, surface: "", after: "", matched: false };
  }
  return {
    before: sentence.slice(0, found.index),
    surface: found.surface,
    after: sentence.slice(found.index + found.length),
    matched: true,
  };
}
