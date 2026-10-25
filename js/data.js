const REQUIRED_FIELDS = ["id", "word", "pos", "zh", "example", "exampleZh"];

function isRelated(item) {
  return Boolean(item)
    && typeof item.word === "string"
    && typeof item.pos === "string"
    && typeof item.zh === "string";
}

async function fetchJson(url, label) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`無法讀取 ${label}。請用本機伺服器開啟網站，不要直接點開檔案。`);
  }
  if (!response.ok) {
    throw new Error(`找不到 ${label}（${response.status}）。`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} 不是有效的 JSON。`);
  }
}

export async function loadCatalog() {
  const indexUrl = new URL("../data/units.json", import.meta.url);
  const index = await fetchJson(indexUrl, "data/units.json");
  if (!index || !Array.isArray(index.units)) {
    throw new Error("data/units.json 裡找不到 units 陣列。");
  }

  const seen = new Set();
  const units = [];
  for (const meta of index.units) {
    if (!meta || typeof meta.id !== "string" || typeof meta.file !== "string") {
      throw new Error("data/units.json 的單元資料不完整。");
    }
    if (!/^[a-z0-9-]+\.json$/i.test(meta.file)) {
      throw new Error(`不允許的單字檔名：${meta.file}`);
    }
    const unitUrl = new URL(`../data/${meta.file}`, import.meta.url);
    const unit = await fetchJson(unitUrl, `data/${meta.file}`);
    if (!unit || !Array.isArray(unit.words)) {
      throw new Error(`data/${meta.file} 裡找不到 words 陣列。`);
    }

    const words = unit.words.map((word, index) => {
      for (const key of REQUIRED_FIELDS) {
        if (typeof word?.[key] !== "string" || word[key].trim() === "") {
          throw new Error(`data/${meta.file} 第 ${index + 1} 個單字缺少 ${key}。`);
        }
      }
      if (seen.has(word.id)) throw new Error(`單字 id 重複：${word.id}`);
      seen.add(word.id);
      return {
        ...word,
        notes: typeof word.notes === "string" ? word.notes : "",
        related: Array.isArray(word.related) ? word.related.filter(isRelated) : [],
        unitId: unit.id || meta.id,
        unitTitle: unit.title || meta.title || meta.id,
        unitLevel: unit.level || meta.level || "",
        no: index + 1,
      };
    });

    const phrases = await loadPhrases(meta, unit, seen);

    units.push({
      id: unit.id || meta.id,
      level: unit.level || meta.level || "",
      title: unit.title || meta.title || meta.id,
      titleEn: unit.titleEn || meta.titleEn || "",
      file: meta.file,
      words,
      phrases,
    });
  }

  return units;
}

async function loadPhrases(meta, unit, seen) {
  if (meta.phrases == null || meta.phrases === "") return [];
  if (typeof meta.phrases !== "string" || !/^[a-z0-9-]+\.json$/i.test(meta.phrases)) {
    throw new Error(`不允許的片語檔名：${meta.phrases}`);
  }
  const phraseUrl = new URL(`../data/${meta.phrases}`, import.meta.url);
  const doc = await fetchJson(phraseUrl, `data/${meta.phrases}`);
  if (!doc || !Array.isArray(doc.phrases)) {
    throw new Error(`data/${meta.phrases} 裡找不到 phrases 陣列。`);
  }
  return doc.phrases.map((phrase, index) => {
    for (const key of ["id", "phrase", "zh"]) {
      if (typeof phrase?.[key] !== "string" || phrase[key].trim() === "") {
        throw new Error(`data/${meta.phrases} 第 ${index + 1} 個片語缺少 ${key}。`);
      }
    }
    if (seen.has(phrase.id)) throw new Error(`片語 id 重複：${phrase.id}`);
    seen.add(phrase.id);
    return {
      id: phrase.id,
      word: phrase.phrase,
      pos: "片語",
      zh: phrase.zh,
      example: typeof phrase.example === "string" ? phrase.example : "",
      exampleZh: typeof phrase.exampleZh === "string" ? phrase.exampleZh : "",
      notes: typeof phrase.notes === "string" ? phrase.notes : "",
      related: [],
      unitId: unit.id || meta.id,
      unitTitle: unit.title || meta.title || meta.id,
      unitLevel: unit.level || meta.level || "",
      no: index + 1,
    };
  });
}
