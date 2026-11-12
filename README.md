# 魔法數學浮空島｜第一島：阿栗的麵包店

給 4–6 歲孩子的 3D 數學故事世界，使用 React、Vite、Three.js、React Three Fiber 與 Drei。目前可玩內容是第一座島「阿栗的麵包店」，包含五段短故事與十個任務。整體世界以角色互助與修復家園連接森林、城堡、牧場及彩虹橋，最終讓天空花園開花。

世界路線與原始規劃對照見 [WORLD_DESIGN.md](WORLD_DESIGN.md)，共同 3D 標準與首島精確規則見 [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md)，首島 P0–P7 驗收及世界 W0–W7 擴展計畫見 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)。其他島、世界地圖、天空小屋、重玩變式及家長摘要仍是規劃，尚未新增到遊戲；舊版單題小島與刷題星星介面維持退役。

## 交給 Cursor 或其他開發者

從 [CURSOR_HANDOFF.md](CURSOR_HANDOFF.md) 開始：包括最新可玩範圍、已認可的 UI／3D、整季故事與劇情推進、各島任務製作表、森林首段的分鏡／數值／互動／存檔契約、建議檔案分工，以及可直接貼給 Cursor 的開工指令。

下一個目標是「森林車站的第一顆芽」。先依 C1–C8 串接世界導航與相容存檔，再完成種植三盆、重排後數量仍為三的完整故事。這份計畫不代表森林已上線；即時狀態統一看 [DEVELOPMENT_PLAN.md 第 18 節](DEVELOPMENT_PLAN.md#18-cursor-接手計畫與下一輪工作板2026-11-13)。

## 啟動與檢查

建議使用 Node.js 22.12+。

```bash
npm ci
npm run dev
npm test
npm run test:browser
npm run test:sample
npm run test:ui
npm run build
npm run preview
```

建置產物位於 `dist/`，不需要帳號、API 金鑰或後端服務。瀏覽器回歸預設使用已安裝的 Microsoft Edge；可透過 `BAKERY_BROWSER` 指定 Playwright 的其他瀏覽器 channel，或以 `BAKERY_EXECUTABLE_PATH` 指定已安裝的 Chromium 執行檔。例如 Linux：

```bash
BAKERY_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
BAKERY_EXECUTABLE_PATH=/usr/bin/chromium npm run test:sample
BAKERY_EXECUTABLE_PATH=/usr/bin/chromium npm run test:ui
```

`test:browser` 驗證十個任務、續玩、輔助操作、減少動態觸控與中斷情境；`test:sample` 專測一般動態下，首段故事及招牌的原生觸控事件流程。`test:ui` 檢查四種尺寸的數字卡、成功／結尾重聽與通關後自由烘焙入口；極矮視窗允許捲動。可用 `npm run test:browser -- --input-only` 單獨重跑觸控、滑鼠、語音與 WebGL 備援分段，亦可用 `--desktop-only` 單獨檢查滑鼠、語音與 WebGL 備援。預設命令仍包含所有分段及十任務回歸。

## 已接入的功能

- 當前版本以首島麵包店為入口，五段短故事、十個數量任務及島內順序解鎖。
- 程序化 3D 店面、六種點心、阿栗及三位朋友、五區故事背景。
- 首島美術樣板：雙坡屋頂與遮陽棚、暖色霧面光影、圍裙狐狸、切痕麵包與彎月可頌、烤盤／展示盤／編織籃、廚房窗框與工作架。
- 阿栗有呼吸、眨眼、引導與短暫成功動作；數數時降低動態，支援系統減少動態設定。
- 點選或直接拖曳點心搬運，以及來源選取／放置的鍵盤等效控制。
- 不改存檔的 3D 示範、逐個照亮數數、答錯再試、文字及語音引導。
- 五件固定位置裝飾、三種遮陽棚顏色、0–5 個點心的自由烘焙。
- 沿用 `magic-math-bakery-v1`，保存合法舊進度、任務搬運、裝飾及聲音偏好。
- 返回續玩、重設二次確認、靜音與減少動態支援。
- WebGL 無法顯示時可使用輔助控制繼續任務；完整預渲染美術備援尚未完成。

## 目前首島驗證與限制

首島美術紀錄見 [DEVELOPMENT_PLAN.md 第 16 節](DEVELOPMENT_PLAN.md#16-首島美術與互動樣板2026-11-12)，幼兒介面改版與本輪驗證見 [第 17 節](DEVELOPMENT_PLAN.md#17-幼兒操作介面改版2026-11-12)。測試使用 Linux Chromium 的無頭瀏覽器，390×844 與 1024×768 為模擬尺寸。完整回歸涵蓋十個任務、五次領獎、自由烘焙、示範不改存檔、減少動態觸控與鍵盤等效操作；首段樣板另測一般動態的原生觸控拖曳／點放、取消、搬運後重載、逐個數數，以及多指取消與招牌安裝續存。滑鼠拖放、失焦、次要指標及 context lost 等邊界包含合成事件，不能代替實機測試。數數會等待語音完成，照亮時機跟隨語音開始，靜音保留逐項視覺引導。

這些結果不是手機或平板實機證據。正式美術品質、角色完整表演、各任務專屬容器、預渲染備援、觸控命中尺寸、真實 context lost 復原、目標裝置 30 FPS 與 4–6 歲試玩仍未完成驗收；因此首島 P0–P7 尚不能全部標為完成；世界 W0–W7 的狀態另依開發計畫追蹤。建置目前仍有 JavaScript 區塊大於 500 kB 的警告。

語音由瀏覽器 SpeechSynthesis 提供，音效由 Web Audio 合成；中文語音品質及可用性取決於裝置。模型為專案內程序化幾何，未下載外部圖片、模型或音訊。

## 幼兒操作介面

首頁突出「一起玩／繼續玩」，故事清單預設收起，家長設定與兒童活動分開。任務使用短指令、語音重播、圖示大按鈕及大型數字卡；寬螢幕把答案放在工作台旁，手機放在下方。鍵盤輔助控制可展開，3D 失敗時自動展開；重設進度仍需二次確認。介面改版不改故事數值或 v1 存檔，真機與幼兒理解仍待試玩驗收。

`test:sample` 也檢查主要下一步的可視範圍、按鈕大小、預設收起的清單、設定確認取消及存檔保留。

## 美術共用元件

`ToyPrimitives.jsx` 提供暖色霧面基本體與燈光；`Pastries.jsx` 提供程序化麵包和可頌；`FoxModel.jsx` 管理阿栗造型、語音口型與短動作。工作台與總覽共用這些模型，數學、輸入、存檔規則仍由原有模組負責。本輪沿用 R3F／Drei／useFrame，未加入 GSAP、後製或外部模型素材。
