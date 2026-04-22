# cite.review

English | [繁體中文](README.zh-TW.md)

**cite.review** 在遞交或發表前幫你驗證法律引用——零成本抓出 AI 捏造的案例與被誤用的判決。

🔗 **https://cite.review** · [API 設定指南](https://cite.review/api-setup.html) · [常見問題](https://cite.review/faq.html)

---

## 這個工具做什麼

cite.review 進行兩層連續檢查。

**第 1 步 — 資料庫驗證（不需 AI）**
每條引用都會對照三個公開免費的權威資料庫：
- [CourtListener](https://www.courtlistener.com/) — 聯邦及州法院判例
- [Cornell LII](https://www.law.cornell.edu/) — 美國法典（U.S.C.）及聯邦法規（C.F.R.）
- [GovInfo](https://www.govinfo.gov/) — 公法（Pub. L.）、聯邦公報及其他官方文件

結果標記為 **Verified（已驗證）**、**Warning（警告，找到但欄位不符）** 或 **Not Found（未找到）**。

**第 2 步 — 備忘錄支持性檢查（選用，需 AI API 金鑰）**
針對已驗證的案例，cite.review 從 CourtListener 取得實際判決原文，再由你選擇的 AI 服務判斷該案例是否真的支持你備忘錄中的主張。此步驟完全由瀏覽器直接與 AI 服務商通訊，cite.review 伺服器不介入。

支援 AI 服務：Anthropic Claude、OpenAI GPT、Google Gemini、Kimi K2，以及本地模型（Ollama / LM Studio，不離開你的裝置）。

---

## 適合誰使用

- Law review 編輯與學生
- 律所助理律師（準備書狀與備忘錄）
- 沒有 Westlaw 或 Lexis 的獨立執業律師
- 法律學生與研究者
- 任何使用 AI 起草法律文件的人

---

## 快速開始

1. 開啟 **https://cite.review**
2. 取得免費 CourtListener API token — [設定指南](https://cite.review/api-setup.html)
3. 上傳 DOCX、PDF、TXT、Markdown、HTML，或直接貼上文字
4. 點 **Verify File**
5. 查看 Verified / Warning / Not Found 結果
6. 選用：點 **Check Support** 進行 AI 支持性分析
7. 點 **Export ↓** 匯出 HTML + CSV 報告，或用 **Export ZIP** 批次匯出

---

## 支援格式

| 格式 | 備註 |
|------|------|
| `.docx` | 解析品質最佳，保留腳注結構 |
| `.pdf` | 瀏覽器 OCR 可掃描頁面；文字可選擇的 PDF 效果更好 |
| `.txt` | 純文字 |
| `.md` | Markdown |
| `.html` | HTML 原始碼 |
| 貼上 | 直接貼入文字或 Markdown |

可同時排入多個檔案，每個檔案有獨立的驗證結果卡片。

---

## 可驗證的引用類型

| 引用類型 | 驗證方式 |
|----------|----------|
| 判例法 | CourtListener 引用索引 + 全文搜尋備援 |
| 美國法典（U.S.C.） | Cornell LII |
| C.F.R. / 聯邦訴訟規則 | Cornell LII |
| 公法（Pub. L.） | GovInfo |
| 聯邦公報 | GovInfo 搜尋連結 |
| 州法典 | 提示手動驗證（無法自動驗證） |
| Restatement | Westlaw 二手資料搜尋連結 |
| 期刊論文 | Google Scholar + 期刊縮寫解析 |
| Westlaw (WL) / LexisNexis 引用 | Westlaw 搜尋連結 |
| 案號（Docket number） | CourtListener RECAP |
| URL | 透過代理的 HTTP 即時檢查 |

---

## 隱私

- **你的文件不會離開瀏覽器。** 檔案解析完全在本地 JavaScript 執行。
- **API 金鑰只存在 `localStorage`。** cite.review 伺服器永遠不會收到你的金鑰。
- **第 1 步** 只傳送引用字串（例如 `556 U.S. 662`）給資料庫，不傳文件內容。
- **第 2 步** 將相關備忘錄段落與判決原文，由你的瀏覽器直接傳給 AI 服務商，cite.review 不在中間。
- 使用**本地模型**（Ollama / LM Studio）時，第 2 步完全不離開你的裝置。
- 原始碼公開可審核：[github.com/kirinccchang/citereview](https://github.com/kirinccchang/citereview)

---

## 費用

cite.review 本身**完全免費——無付費牆、無訂閱、無需帳號。**

唯一可能的費用是使用第 2 步時 AI 服務商向你收取的 API 費，cite.review 不收任何費用。

---

## 常見問題

<details>
<summary>為什麼 cite.review 需要存在？</summary>

2023 年，*Mata v. Avianca* 案的律師因遞交 AI 生成、根本不存在的案例引用而遭到制裁。2026 年 4 月，Sullivan & Cromwell 也就 AI 捏造引用向聯邦破產法院道歉。

Kirin Chang 即將發表於《Georgetown Law Journal》（Online）的論文主張，在已知風險的情況下使用 AI 引用而不驗證，可能構成魯莽的不實陳述。cite.review 是對此的實務開源工具回應——對所有人免費且可審核，尤其是資源較少的用戶。
</details>

<details>
<summary>什麼是「AI 幻覺（hallucination）」？</summary>

AI 幻覺是指 AI 模型生成聽起來合理、且充滿自信，但實際上在事實上錯誤或完全捏造的資訊。在法律工作中，這包括：捏造案名、真實案名配錯報告冊/頁碼/法院/日期，以及以真實案例支持其實不支持的主張。最後一種情形尤為危險——案例存在、基本搜尋也能找到，但歸因給它的法律命題是錯的。cite.review 第 2 步正是為了抓出這種錯誤而設計。
</details>

<details>
<summary>cite.review 如何驗證引用？</summary>

第 1 步對照三個資料庫：CourtListener（判例法）、Cornell LII（法典與法規）、GovInfo（公法與聯邦文件）。找到且所有關鍵欄位符合 → **Verified**；找到但欄位不完全符合 → **Warning**；找不到任何匹配記錄 → **Not Found**。

第 2 步為選用。cite.review 擷取實際判決原文，再由你的 AI 服務判斷該案例是否支持備忘錄主張，完全在瀏覽器端執行。
</details>

<details>
<summary>案例不在 CourtListener 怎麼辦？</summary>

CourtListener 收錄聯邦法院自建國初期以來的判決，以及多數主要州法院，但仍有缺口——部分州初審法院判決及非常新近的判決可能未收錄。**Not Found** 不一定代表引用是捏造的，可能只是超出收錄範圍。這類引用請透過 Westlaw、Lexis 或法院官網自行核實。
</details>

<details>
<summary>可以驗證法條和法規，不只是判例嗎？</summary>

可以，但有重要限制。cite.review 驗證某個被引用的條文*確實存在*於引用所指的位置，但**不**解讀條文內容、也不評估該條文是否支持你的主張。cite.review 能抓出根本不存在的引用字串，但無法抓出真實條文被誤引的情形——那仍需人工審核。
</details>

<details>
<summary>適用非美國法域嗎？</summary>

如果檔案可讀取，文件解析可以提取非美國文件的文字，但引用驗證目前僅涵蓋美國材料（CourtListener 判例，Cornell LII 和 GovInfo 法典與法規）。
</details>

<details>
<summary>期刊論文、Restatement、Westlaw/Lexis 引用呢？</summary>

cite.review 識別 law review 引用、Restatement 引用和 Westlaw/Lexis 引用字串，並產生預填的 Google Scholar、Westlaw 及二手資料搜尋連結。它解析期刊縮寫為全名。這些類型的內容驗證仍是手動步驟——cite.review 負責構建搜尋查詢。
</details>

<details>
<summary>支援哪些檔案格式？</summary>

DOCX（品質最佳）、PDF（含瀏覽器 OCR 掃描）、TXT、Markdown、HTML，以及直接貼上文字。可同時排入多個檔案。
</details>

<details>
<summary>可以同時上傳多個檔案嗎？</summary>

可以。每個檔案有獨立卡片。可逐一驗證或點 **Run All Files** 依序驗證整個佇列。**Export ZIP** 下載包含每個檔案 HTML + CSV 報告及綜合摘要的單一壓縮包。
</details>

<details>
<summary>你們會看到我的 API 金鑰嗎？</summary>

不會。金鑰只存在你瀏覽器的 `localStorage`，不會傳送給 cite.review 伺服器。AI 服務呼叫由你的瀏覽器直接送到 AI 服務商。原始碼公開可審核。
</details>

<details>
<summary>我的文件會上傳到伺服器嗎？</summary>

不會。文件完全在你的瀏覽器內處理。離開你瀏覽器的資料只有傳送給資料庫的引用字串（例如 `556 U.S. 662`）——不包含文件論述、事實或特權內容。
</details>

<details>
<summary>用於機密客戶文件安全嗎？</summary>

第 1 步（資料庫驗證）只傳送引用字串，不太可能引發特權疑慮。第 2 步（AI 支持性檢查）傳送相關備忘錄段落和判決原文給你的 AI 服務商——是否適合用於機密工作，取決於你的事務所政策和服務商隱私條款。使用本地模型（Ollama / LM Studio）時，第 2 步完全不離開你的裝置。
</details>

<details>
<summary>律師-客戶特權、LLM API 與 United States v. Heppner</summary>

*United States v. Heppner*（S.D.N.Y.）否定了使用消費者 AI 平台的特權保護。cite.review 的架構更為受限：第 1 步只向法律資料庫發送引用查詢，第 2 步只由你的瀏覽器直接將相鄰備忘錄段落和判決原文傳給你選擇的 AI 服務商，cite.review 的 Worker 不代理 AI 提示也不儲存 AI 金鑰。這種設置比使用公開聊天機器人更容易被定性為受控的法律科技工作流程，但特權仍具事實特定性，取決於服務商條款、事務所政策和法域。最保守的做法：只使用第 1 步，或用本地模型執行第 2 步。
</details>

<details>
<summary>如何確認程式碼做的是你說的？</summary>

原始碼在 GitHub 公開。沒有編譯或最小化步驟——repo 中的 HTML、JS 和 CSS 就是在你瀏覽器中運行的完整程式碼。Cloudflare Worker 原始碼也在 repo 的 `worker/` 目錄中。
</details>

<details>
<summary>如何回報問題或建議功能？</summary>

到 [github.com/kirinccchang/citereview/issues](https://github.com/kirinccchang/citereview/issues) 開 issue。
</details>

<details>
<summary>可以貢獻程式碼嗎？</summary>

歡迎。請先開 issue 討論，再提交 pull request。本專案授權 AGPL-3.0。
</details>

---

## lawreview.tools 生態系

cite.review 是 [lawreview.tools](https://lawreview.tools/) 生態系的工具之一，專注於 law review 與法律學術寫作流程。其他工具：[SupraDrop](https://lawreview.tools/supradrop/) · [PermaDrop / Zotero Perma Archiver](https://lawreview.tools/permadrop/) · [DOCX Redline 名稱清理工具](https://lawreview.tools/docx-redline-name-cleaner/)

---

## 部署

完整的上線步驟指南請見 [DEPLOY.md](DEPLOY.md)。

**架構：** Cloudflare Pages（靜態前端）+ Cloudflare Worker（CourtListener、LII、GovInfo、OCR 的 API 代理）。無需建置步驟——直接部署 repo 根目錄。

**網域：** `cite.review`（主要）· `citereview.com`（301 重新導向 → `cite.review`）

---

## 本地開發

只編輯前端時，直接在瀏覽器開啟 `index.html` 即可。Worker 端點（`/api/proxy/*`）在本地無法使用——如需測試，請部署到 Cloudflare 或使用 `wrangler dev`。

---

## 聯絡

- 問題回報 / 功能建議：[github.com/kirinccchang/citereview/issues](https://github.com/kirinccchang/citereview/issues)
- 作者：[kirinchang.com/contact](https://kirinchang.com/contact/)

## 授權

[AGPL-3.0](LICENSE)
