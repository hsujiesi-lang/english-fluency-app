# 英文練習 App（english-fluency-app）

個人英文練習 web app — 口說流暢度 + 三大文法弱點（modal/to 後動詞形式、冠詞單複數、詞性誤用）。

## 開發

```bash
npm install
npm run dev        # http://localhost:8771
npm run build      # 產出 dist/
```

## 部署（GitHub Pages）

線上網址：https://hsujiesi-lang.github.io/english-fluency-app/

```bash
npm run build
cd dist && git init -q && git checkout -q -b gh-pages && git add -A \
  && git commit -q -m Deploy \
  && git push -f https://github.com/hsujiesi-lang/english-fluency-app.git gh-pages
cd .. && rm -rf dist/.git
```

## v1 模組

| 模組 | 位置 | 說明 |
|------|------|------|
| 每日短句（120 句） | 短句 | 聽讀（TTS 0.7x/1.0x）、中翻英（8 秒 STT + 模糊比對）、早安晚安法 |
| 口說流暢度 | 口說 | 30 秒準備 → 60 秒口說 → AI 評流暢度 → 強制重講 45 秒 → 比較 |
| 錯誤獵人 | 獵人 | 每日 10 題：動詞形式快打（10 秒/題）、偵錯短文（90 秒點擊標記）、詞性辨析 |
| 個人錯誤庫 | 我的 → 錯誤庫 | 各模式錯誤自動收集；簡化 SM-2（答對 ×2.5，答錯重設 1 天）；AI 變形出題 |
| 單字庫 | 我的 → 單字庫 | 依詞性分類；拼寫→聽音拼寫、語意→造句、用法→詞性選擇 |
| 寫作練習 | 寫作 | Paraphrase 改寫 / 冠詞區分 / 詞性使用 — 全打字產出，無選擇題 |
| 圖片描述 | 圖片 | Lv1-4（五句→段落→兩圖比較→圖表）；寫作版（5 分鐘，vision 嚴格批改＋contentAccuracy）/ 口說版（60 秒＋強制重講）；Picsum 隨機圖、自傳照片、內建 SVG 圖表 |

## AI 回饋

「我的 → 設定」貼上 Anthropic API key（console.anthropic.com）。金鑰只存在瀏覽器 localStorage。
沒有金鑰時全部模式仍可用（規則判定），但沒有：口說評分、AI 偵錯短文生成、造句檢查、翻譯同義判定。

## 資料

全部存 localStorage（`efa:` 前綴）。設定頁可匯出/匯入 JSON 備份。
內容資料在 `public/data/`（120 短句含同義變體、IN/ON/AT 介係詞題庫）。

## v2 待做（規格書第 2 節）

- 文法專區：介係詞題庫（資料已在 `public/data/prepositions.json`）、時態辨析、phrasal verbs
- Phrasal verbs 需先執行 Notion 匯入（規格書第 5 節）：`claude mcp add --transport http notion https://mcp.notion.com/mcp` 授權後由 Claude Code 讀取 English 頁面產出 `public/data/phrasal-verbs.json`
- Paraphrase 訓練營
