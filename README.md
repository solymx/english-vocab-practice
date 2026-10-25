# 英文單字練習

純靜態的英文單字練習網站，用手機或電腦都能練。目前收錄 **練習1**（70 個）、**練習2**（81 個）、**練習3**（76 個）。

可以練的方式：

- 字卡：翻面、上一張、下一張、洗牌
- 選擇題：英選中、中選英，或混合出題
- 拼字：看中文意思，拼出英文
- 聽音拼字：聽美式英語發音，再把單字拼出來
- 例句填空：例句裡的單字會被挖空，字尾變化（例如 argued、clauses）也認得出來
- 單字列表：依單元瀏覽，可用英文或中文搜尋

每個單字都可以按「發音」。例句出現時可以按「唸例句」，把整句英文唸出來。答對、答錯次數，以及「不熟」清單，存在這台裝置的 localStorage。可以只練不熟、或答錯比答對多的字。清除紀錄前會再問一次。

## 打開網站

<https://solymx.github.io/english-vocab-practice/>

合併到 `main` 之後，GitHub Actions 會把這個倉庫發佈到 GitHub Pages。如果是第一次開啟，請到倉庫 **Settings → Pages → Build and deployment**，來源選 **GitHub Actions**。

## 本機預覽

在倉庫根目錄執行：

```bash
python3 -m http.server 8000
```

瀏覽器打開 <http://127.0.0.1:8000/>。

請用本機伺服器開，不要直接點開 `index.html`。直接開檔案時，瀏覽器會擋住讀取 JSON。

## 怎麼加一個單元

1. 新增 `data/unit-02.json`，格式比照 `data/unit-01.json`。
2. 在 `data/units.json` 的 `units` 陣列加一筆。`file` 只能是檔名，例如 `unit-02.json`。
3. 每個單字必填 `id`、`word`、`pos`、`zh`、`example`、`exampleZh`。
4. `id` 全站不可重複。建議加上單元前綴，例如 `u02-offer`。
5. `example` 必須包含字頭，或一般字尾變化：`-s`、`-es`、`-ed`、`-ing`、去詞尾 e 再加 ing／ed，或像 deferred 這種重複最後一個子音。例句填空靠這些形式找到要挖空的字。
6. `notes` 和 `related` 可以省略。`related` 的每一項要有 `word`、`pos`、`zh`。

```json
{
  "id": "u02-offer",
  "word": "offer",
  "pos": "n.",
  "zh": "要約；出價",
  "example": "We sent a written offer before the meeting.",
  "exampleZh": "我們在會議前送出了書面要約。",
  "notes": "make an offer 是提出要約。",
  "related": [
    { "word": "counteroffer", "pos": "n.", "zh": "反要約" }
  ]
}
```

介面文字用繁體中文（台灣用語）。路徑都是相對的，所以放在 GitHub Pages 的 `/english-vocab-practice/` 底下也能運作，不需要建置。

## 資料來源

字表依使用者自己的學習用書，只供個人學習。練習1 對應該書 Unit 1「談判與簽約」（Track 0001–0070），練習2 對應 Unit 2「市場行銷」（Track 0071–0151），練習3 對應 Unit 3「併購與轉讓」（Track 0152–0227）。順序、字頭、詞性與簡短中文對應該書。例句、中文翻譯和用法筆記是另行撰寫的，不是書中原文。
