# 魔法數學浮空島 · Magic Math Islands

為 4–6 歲幼兒設計的互動數學冒險遊戲，使用 React、Vite、Three.js、React Three Fiber 和 Drei。

## 本機啟動

建議使用 Node.js 20.19+ 或 22.12+。

```bash
git clone https://github.com/KL-4ndroid/math-kid.git
cd math-kid
npm ci
npm run dev
```

開啟終端顯示的本機網址。

## 正式建置

```bash
npm run build
npm run preview
```

靜態產物位於 `dist/`。本專案不需要 API 金鑰或後端服務。

## 遊戲內容

- 數數森林：數出 1–5 個動物或水果。
- 形狀城堡：配對三角形、正方形和圓形。
- 比大小牧場：找出點心比較多的一組。
- 加法麵包屋：用草莓練習總和不超過 5 的加法。
- 規律彩虹橋：完成顏色或形狀的重複規律。

答對即可收集星星；進度保存在目前瀏覽器的 localStorage。所有島嶼皆可自由進入，重返島嶼會產生新題目。

## 操作與無障礙

點擊 3D 島嶼或下方島嶼按鈕開始。拖曳旋轉地圖，滾輪或雙指縮放。遊戲中可按「聽題目」重新朗讀；支援鍵盤 Tab、Enter 和 Escape 返回地圖。

所有 3D 物件皆由基本幾何產生，沒有外部模型、圖片、字型或音訊素材。音效由 Web Audio API 合成，題目使用瀏覽器 SpeechSynthesis 的 `zh-TW` 語音。實際語音依裝置安裝的語音而定；若自動朗讀被瀏覽器限制，請點擊「聽題目」。3D 場景需要 WebGL；無法顯示時仍可用下方島嶼選單進入遊戲。

## 專案結構

```text
index.html
src/
  main.jsx
  App.jsx
  App.css
  data/islandsData.js
  utils/sound.js
  components/IslandScene.jsx
  components/MathGameModal.jsx
```

## 驗證

已通過 Vite 正式建置，並檢查 10,000 道隨機題目的選項唯一性、正確答案、加法範圍、大小比較與規律。瀏覽器中的 3D 互動及語音尚未實測。
