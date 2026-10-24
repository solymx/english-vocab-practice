import { splitExample } from "./cloze.js";
import { escapeHtml } from "./html.js";

const MODE_COPY = {
  cards: { name: "字卡", blurb: "翻面看意思與例句，適合先認識單字。" },
  quiz: { name: "選擇題", blurb: "英文選中文，或中文選英文。" },
  spell: { name: "拼字", blurb: "看中文意思，拼出英文單字。" },
  listen: { name: "聽音拼字", blurb: "聽發音，把單字拼出來。" },
  cloze: { name: "例句填空", blurb: "例句挖空，填回單字或變化形。" },
  list: { name: "單字列表", blurb: "瀏覽、搜尋，順便標記不熟。" },
};

export function modeName(mode) {
  return MODE_COPY[mode]?.name || "練習";
}

function speakerIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 10h3.2L12 6.2v11.6L7.2 14H4v-4zm11.2 2a3.8 3.8 0 0 0-1.9-3.3v6.6A3.8 3.8 0 0 0 15.2 12zm-1.9-6.4v2.05a6.2 6.2 0 0 1 0 8.7v2.05a8.2 8.2 0 0 0 0-12.8z"/></svg>`;
}

function speakButton(text, label, rate) {
  const rateAttr = rate ? ` data-rate="${rate}"` : "";
  return `<button type="button" class="btn btn-ghost" data-action="speak" data-text="${escapeHtml(text)}"${rateAttr}>${speakerIcon()}<span>${escapeHtml(label)}</span></button>`;
}

function markButton(word) {
  const on = word.marked;
  return `<button type="button" class="btn btn-mark${on ? " is-on" : ""}" data-action="mark" data-id="${escapeHtml(word.id)}" aria-pressed="${on ? "true" : "false"}">${on ? "已標記" : "不熟"}</button>`;
}

function padNo(number) {
  return String(number).padStart(2, "0");
}

function relatedHtml(word) {
  if (!word.related.length) return "";
  const chips = word.related.map((item) => (
    `<li><span lang="en">${escapeHtml(item.word)}</span> <span class="pos">${escapeHtml(item.pos)}</span> ${escapeHtml(item.zh)}</li>`
  )).join("");
  return `<div class="block"><h3>相關字</h3><ul class="related">${chips}</ul></div>`;
}

function notesHtml(word) {
  if (!word.notes) return "";
  return `<div class="block"><h3>用法</h3><p>${escapeHtml(word.notes)}</p></div>`;
}

function highlightedExample(word) {
  const parts = splitExample(word.example, word.word);
  if (!parts.matched) return `<p class="example" lang="en">${escapeHtml(word.example)}</p>`;
  return `<p class="example" lang="en">${escapeHtml(parts.before)}<mark>${escapeHtml(parts.surface)}</mark>${escapeHtml(parts.after)}</p>`;
}

function clozeSentence(word) {
  const parts = splitExample(word.example, word.word);
  if (!parts.matched) {
    return `<p class="warn">這句找不到可以挖空的單字，先看完整例句。</p>${highlightedExample(word)}`;
  }
  return `<p class="example cloze" lang="en">${escapeHtml(parts.before)}<span class="blank" role="img" aria-label="空格"></span>${escapeHtml(parts.after)}</p>`;
}

function wordMeta(word) {
  const bits = [word.unitLevel, word.unitTitle, padNo(word.no)].filter(Boolean);
  return escapeHtml(bits.join(" · "));
}

function attemptLine(word) {
  if (!word.correct && !word.wrong) return "";
  return `<p class="attempt">答對 ${word.correct} · 答錯 ${word.wrong}</p>`;
}

function topbar(vm) {
  return `<header class="topbar">
    <a class="brand" href="#/">
      <span class="logo" aria-hidden="true">字</span>
      <span>
        <span class="brand-kicker">English Vocab</span>
        <span class="brand-name">英文單字練習</span>
      </span>
    </a>
    <p class="top-mark">${vm.summary.marked} 個不熟</p>
  </header>`;
}

function scopeSwitch(vm) {
  return `<div class="segmented" role="group" aria-label="練習範圍">
    <button type="button" class="${vm.scope === "all" ? "is-on" : ""}" data-action="scope" data-value="all" aria-pressed="${vm.scope === "all" ? "true" : "false"}">全部單字</button>
    <button type="button" class="${vm.scope === "review" ? "is-on" : ""}" data-action="scope" data-value="review" aria-pressed="${vm.scope === "review" ? "true" : "false"}">不熟與答錯</button>
  </div>
  <p class="field-help">${vm.scope === "review"
    ? "含已標記不熟的字，以及答錯次數多於答對次數的字。"
    : `這個範圍有 ${vm.summary.review} 個字會出現在「不熟與答錯」。`}</p>`;
}

function unitSelect(vm) {
  const options = [`<option value="all"${vm.unitId === "all" ? " selected" : ""}>全部單元（${vm.allCount}）</option>`];
  for (const unit of vm.units) {
    const selected = vm.unitId === unit.id ? " selected" : "";
    options.push(`<option value="${escapeHtml(unit.id)}"${selected}>${escapeHtml(unit.level)} ${escapeHtml(unit.title)}（${unit.count}）</option>`);
  }
  return `<label class="field" for="unit-select">
    <span>單元</span>
    <select id="unit-select">${options.join("")}</select>
  </label>`;
}

function statChips(vm) {
  const rate = vm.summary.rate === null ? "尚無紀錄" : `${vm.summary.rate}%`;
  return `<ul class="chips">
    <li><strong>${vm.scope === "review" ? vm.summary.review : vm.summary.total}</strong><span>${vm.scope === "review" ? "個待複習" : "個單字"}</span></li>
    <li><strong>${rate}</strong><span>正確率</span></li>
    <li><strong>${vm.summary.marked}</strong><span>個不熟</span></li>
    <li><strong>${vm.summary.answered}</strong><span>次作答</span></li>
  </ul>`;
}

function renderHome(vm) {
  const modes = ["cards", "quiz", "spell", "listen", "cloze", "list"];
  const cards = modes.map((mode, index) => {
    const copy = MODE_COPY[mode];
    return `<a class="mode-card" href="#/${mode}" data-mode="${mode}">
      <span class="mode-index">${padNo(index + 1)}</span>
      <span>
        <strong>${copy.name}</strong>
        <small>${copy.blurb}</small>
      </span>
    </a>`;
  }).join("");

  return `${topbar(vm)}
  <main class="stack">
    <section class="hero">
      <p class="eyebrow">${escapeHtml(vm.eyebrow)}</p>
      <h1>今天想怎麼練？</h1>
      <p class="lede">字卡、選擇題、拼字、聽音和例句填空。紀錄只留在這台裝置。</p>
    </section>
    <section class="panel stack">
      ${unitSelect(vm)}
      ${scopeSwitch(vm)}
      ${statChips(vm)}
    </section>
    <section class="mode-grid" aria-label="練習模式">${cards}</section>
    <section class="panel quiet">
      <h2>練習紀錄</h2>
      <p>答對、答錯和不熟清單都存在瀏覽器的 localStorage。換裝置或清除網站資料後就會消失。</p>
      <button type="button" class="btn btn-danger" data-action="open-reset">清除練習紀錄</button>
    </section>
    <p class="footnote">例句與用法筆記是自編的，供個人練習。字表依學習用書 Unit 1。</p>
  </main>`;
}

function practiceBar(session) {
  return `<div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="${session.total}" aria-valuenow="${session.index}" aria-label="本輪進度">
    <span style="width:${session.percent}%"></span>
  </div>`;
}

function practiceHead(vm) {
  const session = vm.session;
  const score = session.mode === "cards"
    ? ""
    : `<p class="round-score">本輪答對 ${session.roundCorrect} · 答錯 ${session.roundWrong}</p>`;
  return `${topbar(vm)}
  <main class="stack">
    <div class="practice-head">
      <a class="back" href="#/">回首頁</a>
      <div>
        <h1>${escapeHtml(session.modeName)}</h1>
        ${score}
      </div>
      <p class="count">${session.index} / ${session.total}</p>
    </div>
    ${practiceBar(session)}`;
}

function renderCards(vm) {
  const { session } = vm;
  const word = session.word;
  const face = session.flipped
    ? renderCardBack(word)
    : `<div class="face" data-action="flip">${renderCardFront(word)}</div>`;
  return `${practiceHead(vm)}
    ${session.note ? `<p class="toast" role="status">${escapeHtml(session.note)}</p>` : ""}
    <article class="study-card${session.flipped ? " is-back" : ""}">
      ${face}
    </article>
    <div class="action-row">
      <button type="button" class="btn btn-ghost" data-action="prev" ${session.canPrev ? "" : "disabled"}>上一個</button>
      <button type="button" class="btn btn-ghost" data-action="next" ${session.canNext ? "" : "disabled"}>下一個</button>
      <button type="button" class="btn btn-ghost" data-action="shuffle">洗牌</button>
      <button type="button" class="btn btn-ghost" data-action="restart-cards">從頭再看</button>
    </div>
    <p class="kbd-only">鍵盤：← → 換一張，空白鍵翻面，S 發音，M 標記不熟。</p>
  </main>`;
}

function renderCardFront(word) {
  return `<p class="meta">${wordMeta(word)}</p>
    <div class="card-tools">${speakButton(word.word, "發音")}${markButton(word)}</div>
    <p class="pos">${escapeHtml(word.pos)}</p>
    <h2 class="headword" lang="en">${escapeHtml(word.word)}</h2>
    <button type="button" class="text-btn" data-action="flip">看意思</button>
    ${attemptLine(word)}`;
}

function renderCardBack(word) {
  return `<p class="meta">${wordMeta(word)}</p>
    <div class="card-tools">${speakButton(word.word, "發音")}${markButton(word)}</div>
    <h2 class="meaning">${escapeHtml(word.zh)}</h2>
    <p class="headword headword-small" lang="en">${escapeHtml(word.word)} <span class="pos">${escapeHtml(word.pos)}</span></p>
    ${highlightedExample(word)}
    <p class="example-zh">${escapeHtml(word.exampleZh)}</p>
    <div class="card-tools">${speakButton(word.example, "朗讀例句", "0.86")}</div>
    ${notesHtml(word)}
    ${relatedHtml(word)}
    <button type="button" class="text-btn" data-action="flip">看單字</button>`;
}

function directionSwitch(session) {
  const options = [
    ["en-zh", "英選中"],
    ["zh-en", "中選英"],
    ["mix", "混合"],
  ];
  const buttons = options.map(([value, label]) => {
    const on = session.direction === value;
    return `<button type="button" class="${on ? "is-on" : ""}" data-action="direction" data-value="${value}" aria-pressed="${on ? "true" : "false"}">${label}</button>`;
  }).join("");
  return `<div class="segmented" role="group" aria-label="選擇題方向">${buttons}</div>`;
}

function renderQuiz(vm) {
  const { session } = vm;
  const word = session.word;
  const prompt = session.asked === "en-zh"
    ? `<p class="ask-label">這個英文是什麼意思？</p>
       <div class="prompt-row"><h2 class="headword" lang="en">${escapeHtml(word.word)}</h2><span class="pos">${escapeHtml(word.pos)}</span>${speakButton(word.word, "發音")}</div>`
    : `<p class="ask-label">哪個英文是這個意思？</p><h2 class="meaning">${escapeHtml(word.zh)}</h2>`;
  const letters = ["A", "B", "C", "D"];
  const choices = session.choices.map((choice, index) => {
    const pos = session.asked === "zh-en" ? `<span class="pos">${escapeHtml(choice.pos)}</span>` : "";
    return `<button type="button" class="choice ${choice.state}" data-action="pick" data-id="${escapeHtml(choice.id)}" ${session.phase === "feedback" ? "disabled" : ""}>
      <span class="letter">${letters[index] || ""}</span>
      <span>${escapeHtml(choice.label)}</span>
      ${pos}
    </button>`;
  }).join("");

  return `${practiceHead(vm)}
    ${directionSwitch(session)}
    <section class="panel stack">
      ${prompt}
      <div class="choices" role="group" aria-label="選項">${choices}</div>
      ${session.phase === "feedback" ? feedbackBlock(session) : ""}
    </section>
  </main>`;
}

function feedbackBlock(session) {
  const word = session.word;
  const title = session.result === "correct" ? "答對了" : "這次答錯了";
  const detail = session.result === "correct" ? correctDetail(session) : wrongDetail(session);
  const nextLabel = session.index >= session.total ? "看成績" : "下一題";
  return `<div class="feedback ${session.result === "correct" ? "is-ok" : "is-bad"}" role="status">
    <h3>${title}</h3>
    <p>${escapeHtml(detail)}</p>
    <p class="answer-word" lang="en">${escapeHtml(word.word)} <span class="pos">${escapeHtml(word.pos)}</span></p>
    <p class="meaning-inline">${escapeHtml(word.zh)}</p>
    ${highlightedExample(word)}
    <p class="example-zh">${escapeHtml(word.exampleZh)}</p>
    <div class="card-tools">${speakButton(word.word, "發音")}${markButton(word)}</div>
    ${notesHtml(word)}
    <button type="button" class="btn btn-primary" id="next-btn" data-action="next-question">${nextLabel}</button>
  </div>`;
}

function correctDetail(session) {
  if (session.mode !== "cloze") return "這個字記住了，看一下例句再繼續。";
  const surface = session.surface;
  if (surface && surface.toLowerCase() !== session.word.word.toLowerCase() && session.answer.trim().toLowerCase() !== surface.toLowerCase()) {
    return `字頭對了。句中用的是 ${surface}。`;
  }
  return "空格填對了。";
}

function wrongDetail(session) {
  const word = session.word;
  if (session.mode === "cloze" && session.surface && session.surface.toLowerCase() !== word.word.toLowerCase()) {
    return `句中應填 ${session.surface}。字頭是 ${word.word}。`;
  }
  return `正確答案是 ${word.word}。`;
}

function answerForm(session) {
  const labels = {
    spell: "輸入英文",
    listen: "輸入英文",
    cloze: "輸入英文",
  };
  const inputLabel = {
    spell: "英文拼法",
    listen: "聽到的單字",
    cloze: "空格裡的字",
  };
  return `<form id="answer-form" class="stack" autocomplete="off">
    <label class="field" for="answer"><span>${inputLabel[session.mode]}</span>
      <input id="answer" name="answer" lang="en" inputmode="text" enterkeyhint="done" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" value="${escapeHtml(session.answer)}" placeholder="${labels[session.mode]}">
    </label>
    ${session.error ? `<p id="form-error" class="form-error">${escapeHtml(session.error)}</p>` : ""}
    <div class="action-row two">
      <button type="submit" class="btn btn-primary">檢查</button>
      <button type="button" class="btn btn-ghost" data-action="reveal">看答案</button>
    </div>
  </form>`;
}

function renderTyped(vm) {
  const { session } = vm;
  const word = session.word;
  let prompt = "";
  if (session.mode === "spell") {
    prompt = `<p class="ask-label">這個中文要怎麼拼？</p>
      <h2 class="meaning">${escapeHtml(word.zh)}</h2>
      <p class="pos">${escapeHtml(word.pos)}</p>`;
  } else if (session.mode === "listen") {
    prompt = `<p class="ask-label">聽一次，把單字拼出來</p>
      ${session.speechOk
        ? `<button type="button" class="speak-hero" data-action="replay">${speakerIcon()}<span>再聽一次</span></button>`
        : `<div class="stack"><p class="warn">這個瀏覽器不支援語音朗讀（Web Speech API）。請改用 Chrome、Edge 或 Safari。</p><a class="btn btn-ghost" href="#/spell">改練拼字</a></div>`}
      ${session.hint ? `<h2 class="meaning">${escapeHtml(word.zh)}</h2>` : `<button type="button" class="text-btn" data-action="hint">看中文提示</button>`}`;
  } else {
    prompt = `<p class="ask-label">填進空格。字尾變化也算對。</p>
      <h2 class="meaning">${escapeHtml(word.zh)}</h2>
      <p class="pos">${escapeHtml(word.pos)}</p>
      ${clozeSentence(word)}
      <p class="example-zh">${escapeHtml(word.exampleZh)}</p>`;
  }

  return `${practiceHead(vm)}
    <section class="panel stack">
      ${prompt}
      ${session.phase === "ask" ? answerForm(session) : feedbackBlock(session)}
    </section>
  </main>`;
}

function renderDone(vm) {
  const { session } = vm;
  const total = session.roundCorrect + session.roundWrong;
  const rate = total ? Math.round((session.roundCorrect / total) * 100) : 0;
  return `${topbar(vm)}
  <main class="stack">
    <section class="hero">
      <p class="eyebrow">${escapeHtml(session.modeName)}</p>
      <h1>這一輪練完了</h1>
      <p class="lede">答對 ${session.roundCorrect} 題，答錯 ${session.roundWrong} 題，正確率 ${rate}%。</p>
    </section>
    <div class="action-row two">
      <button type="button" class="btn btn-primary" data-action="again">再練一輪</button>
      <a class="btn btn-ghost" href="#/">回首頁</a>
    </div>
  </main>`;
}

function renderEmpty(vm) {
  return `${topbar(vm)}
  <main class="stack">
    <section class="hero">
      <p class="eyebrow">${escapeHtml(vm.session.modeName)}</p>
      <h1>這個範圍沒有單字</h1>
      <p class="lede">${vm.scope === "review"
        ? "還沒有不熟或答錯比較多的字。先做一輪練習，或在字卡上標記不熟。"
        : "這個單元目前沒有單字。"}</p>
    </section>
    <a class="btn btn-primary" href="#/">回首頁</a>
  </main>`;
}

function renderBlocked(vm) {
  return `${topbar(vm)}
  <main class="stack">
    <section class="hero">
      <h1>選擇題還湊不齊選項</h1>
      <p class="lede">至少要有兩個意思不同的單字，才能出選擇題。</p>
    </section>
    <a class="btn btn-primary" href="#/">回首頁</a>
  </main>`;
}

export function renderEntries(words) {
  if (!words.length) return `<p class="empty">找不到符合的單字。</p>`;
  return words.map((word) => `<article class="entry">
    <div class="entry-head">
      <button type="button" class="icon-btn" data-action="speak" data-text="${escapeHtml(word.word)}" aria-label="朗讀 ${escapeHtml(word.word)}">${speakerIcon()}</button>
      <div>
        <h2><span class="no">${padNo(word.no)}</span> <span lang="en">${escapeHtml(word.word)}</span> <span class="pos">${escapeHtml(word.pos)}</span></h2>
        <p>${escapeHtml(word.zh)}</p>
        ${attemptLine(word)}
      </div>
      ${markButton(word)}
    </div>
    ${highlightedExample(word)}
    <p class="example-zh">${escapeHtml(word.exampleZh)}</p>
    <details>
      <summary>用法與相關字</summary>
      ${notesHtml(word) || "<p class=\"muted\">這個字沒有額外筆記。</p>"}
      ${relatedHtml(word)}
    </details>
  </article>`).join("");
}

function renderList(vm) {
  return `${topbar(vm)}
  <main class="stack">
    <section class="hero">
      <p class="eyebrow">瀏覽</p>
      <h1>單字列表</h1>
      <p class="lede" id="list-count">${vm.listWords.length} 個，範圍是${vm.scope === "review" ? "不熟與答錯" : "全部單字"}。</p>
    </section>
    <section class="panel stack">
      ${unitSelect(vm)}
      ${scopeSwitch(vm)}
      <label class="field" for="search"><span>搜尋</span>
        <input id="search" type="search" placeholder="英文、中文或例句" value="${escapeHtml(vm.query)}" enterkeyhint="search">
      </label>
    </section>
    <div id="word-list" class="word-list">${renderEntries(vm.listWords)}</div>
  </main>`;
}

function renderDialog() {
  return `<div class="modal-back">
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-copy">
      <h2 id="reset-title">清除練習紀錄？</h2>
      <p id="reset-copy">答對、答錯次數和不熟清單都會刪掉，無法復原。單元選擇會保留。</p>
      <div class="action-row two">
        <button type="button" class="btn btn-ghost" data-action="cancel-reset">取消</button>
        <button type="button" class="btn btn-danger" data-action="confirm-reset">確定清除</button>
      </div>
    </div>
  </div>`;
}

export function renderApp(vm) {
  let body;
  if (vm.route === "home") body = renderHome(vm);
  else if (vm.route === "list") body = renderList(vm);
  else if (!vm.session) body = renderHome(vm);
  else if (vm.session.empty) body = renderEmpty(vm);
  else if (vm.session.blocked) body = renderBlocked(vm);
  else if (vm.session.done) body = renderDone(vm);
  else if (vm.session.mode === "cards") body = renderCards(vm);
  else if (vm.session.mode === "quiz") body = renderQuiz(vm);
  else body = renderTyped(vm);

  return `${body}${vm.dialog ? renderDialog() : ""}`;
}
