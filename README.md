# 英文單字練習

純靜態的英文單字練習網站，用手機或電腦都能練。目前收錄 **練習1**（70 個）、**練習2**（81 個）、**練習3**（76 個）、**練習4**（85 個）、**練習5**（79 個）、**練習6**（74 個）、**練習7**（81 個）、**練習8**（74 個）、**練習9**（72 個）、**練習10**（84 個）、**練習11**（59 個，頁面尚未到齊）、**練習12**（77 個）、**練習13**（80 個）、**練習14**（83 個）、**練習15**（73 個）、**練習16**（78 個）、**練習17**（74 個）、**練習18**（77 個）、**練習19**（80 個）、**練習20**（77 個）、**練習21**（77 個）、**練習22**（82 個）、**練習23**（72 個）、**練習24**（77 個），合計 1842 個。

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

字表依使用者自己的學習用書，只供個人學習。練習1 對應該書 Unit 1「談判與簽約」（Track 0001–0070），練習2 對應 Unit 2「市場行銷」（Track 0071–0151），練習3 對應 Unit 3「併購與轉讓」（Track 0152–0227）。練習4 對應書中「工廠與生產」（Track 0228–0312），練習5 對應「產品研發」（Track 0313–0391），練習6 對應書中標成 Unit 3「品質控管」的字表（Track 0392–0465）。練習7 對應書中 Unit 4「組裝作業」（Track 0466–0546），練習8 對應 Unit 1「銀行與金融服務」（Track 0547–0620），練習9 對應 Unit 2「投資理財」（Track 0621–0692，含 unfavorable 到 volatility），練習10 對應 Unit 3「稅務與會計」（Track 0693–0776）。練習11 對應書中 Unit 1「辦公用品」，目前只收這次頁面上的字：bookcase 到 knob（Track 0777–0809）以及 shelf 到 wastepaper（Track 0827–0852）。Track 0810–0826，以及 bookcase 之前的字，等頁面補上再加。練習12 對應書中 Unit 2「電話與傳真」（Track 0855–0931，absentminded 到 wireless）。Track 0853–0854 這次沒有頁面，先不收。練習13 對應書中 Unit 3「會議安排」（Track 0932–1011，absent 到 vote）。練習14 對應書中 Unit 4「電子郵件」（Track 1012–1094，activate 到 write）。練習15 對應書中 Unit 1「詢價與報價」（Track 1095–1167，abundant 到 worthy）。練習16 對應書中 Unit 2「訂單與出貨」（Track 1168–1245，average 到 waterproof）。練習17 對應書中 Unit 3「發票與付款」（Track 1246–1319，allocate 到 waybill）。練習18 對應書中 Unit 4「投訴與理賠」（Track 1320–1396，accountable 到 warranty）。練習19 對應書中 Unit 1「建築與材料」（Track 1397–1476，alloy 到 wood）。練習20 對應書中 Unit 2「租賃房屋」（Track 1477–1553，admirable 到 widespread）。練習21 對應書中 Unit 1「音樂與愛好」（Track 1554–1630，ability 到 violin）。練習22 對應書中 Unit 2「電影與影視」（Track 1631–1712，acting 到 watchful）。練習23 對應書中 Unit 3「劇場演出」（Track 1713–1784，aisle 到 viewless）。練習24 對應書中 Unit 4「新聞媒體」（Track 1785–1861，affair 到 trim）。網站介面只顯示練習1 到練習24，不顯示書本單元名稱。順序、字頭、詞性與簡短中文對應該書。例句、中文翻譯和用法筆記是另行撰寫的，不是書中原文。
