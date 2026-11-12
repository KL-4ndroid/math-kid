# 阿栗的麵包店

給 4–6 歲孩子的 3D 數學故事遊戲，使用 React、Vite、Three.js、React Three Fiber 與 Drei。產品規格見 [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md)，分階段驗收與實際執行紀錄見 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)。

## 啟動與檢查

建議使用 Node.js 22.12+。

```bash
npm ci
npm run dev
npm test
npm run test:browser
npm run build
npm run preview
```

建置產物位於 `dist/`，不需要帳號、API 金鑰或後端服務。瀏覽器回歸預設使用已安裝的 Microsoft Edge；可透過 `BAKERY_BROWSER` 指定 Playwright 的其他瀏覽器 channel。

## 已接入的功能

- 麵包店唯一入口，五段故事、十個數量任務及順序解鎖。
- 程序化 3D 店面、六種點心、阿栗及三位朋友、五區故事背景。
- 點選或直接拖曳點心搬運，以及來源選取／放置的鍵盤等效控制。
- 不改存檔的 3D 示範、逐個照亮數數、答錯再試、文字及語音引導。
- 五件固定位置裝飾、三種遮陽棚顏色、0–5 個點心的自由烘焙。
- 沿用 `magic-math-bakery-v1`，保存合法舊進度、任務搬運、裝飾及聲音偏好。
- 返回續玩、重設二次確認、靜音與減少動態支援。
- WebGL 無法顯示時可使用輔助控制繼續任務；完整預渲染美術備援尚未完成。

## 目前驗證與限制

規則、存檔及語音生命週期測試 14 項通過，正式建置通過。`npm run test:browser` 使用本機 Windows Edge 的無頭瀏覽器，在 390×844 與 1024×768 模擬尺寸完成全部十個任務與五次領獎，確認示範不修改存檔；另已驗證滑鼠拖放、外部放下、pointercancel、失焦、次要指標干擾、搬運提交後重載、答錯保留搬運、context lost 後輔助操作及停用 WebGL 的首個任務。這些中斷事件為自動化合成事件，不是多指實機驗證。數數會等待語音完成，照亮時機跟隨語音開始，靜音則保留逐項視覺引導。

這些結果不是手機或平板實機證據。正式美術品質、角色完整表演、各任務專屬容器、預渲染備援、觸控命中尺寸、真實 context lost 復原、目標裝置 30 FPS 與 4–6 歲試玩仍未完成驗收；因此 P0–P7 尚不能全部標為完成。建置目前仍有 JavaScript 區塊大於 500 kB 的警告。

語音由瀏覽器 SpeechSynthesis 提供，音效由 Web Audio 合成；中文語音品質及可用性取決於裝置。模型為專案內程序化幾何，未下載外部圖片、模型或音訊。
