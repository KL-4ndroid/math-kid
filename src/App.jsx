import { useCallback, useEffect, useState } from "react";
import BakeryChapter from "./bakery/BakeryChapter.jsx";
import { stopSpeaking } from "./utils/sound.js";
import { BAKERY_KEY, freshProgress, useBakeryProgress } from "./bakery/progress.js";
import { createWorldStore, WORLD_KEY } from "./world/progress.js";
import WorldGateway from "./world/WorldGateway.jsx";
import { islandAccess } from "./world/navigation.js";
import "./App.css";

const browserStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

function Adventure({ store, status, onStatus }) {
  const canSave = useCallback(() => {
    const current = store.checkExternalChange();
    return status.writable && current.writable && !current.progress.resetIntent;
  }, [store, status.writable]);
  const [progress, setProgress, saved] = useBakeryProgress({ canSave });
  const [screen, setScreen] = useState("bakery");
  const returnToBakery = useCallback(() => {
    stopSpeaking();
    setScreen("bakery");
  }, []);
  const openGateway = () => { stopSpeaking(); setScreen("world"); };

  const resetAdventure = () => {
    if (!status.writable) return;
    stopSpeaking();
    const result = store.resetAdventure(crypto.randomUUID());
    onStatus(result);
    if (result.status === "ready") setProgress(freshProgress());
  };

  return (
    <main className="bakery-app">
      {status.message && <p role="status" className="adventure-storage-status">{status.message}</p>}
      {screen === "world" ? <WorldGateway
        bakery={progress}
        world={status.progress}
        onReturn={returnToBakery}
        onRest={() => { stopSpeaking(); setScreen("rest"); }}
      /> : screen === "rest" ? <section className="bakery-content world-gateway">
        <h1>今天先休息</h1><p>做過的小幫忙會留在這裡，想玩的時候再回來。</p>
        <button className="primary" onClick={returnToBakery}>回麵包店</button>
      </section> : <BakeryChapter
        progress={progress}
        setProgress={setProgress}
        saved={saved && status.writable && !status.progress.resetIntent}
        onResetAdventure={resetAdventure}
        onVisitIsland={openGateway}
        worldStatus={{ forestAvailable: islandAccess('forest', progress, status.progress).enterable }}
      />}
    </main>
  );
}

export default function App() {
  const [store] = useState(() => createWorldStore(browserStorage));
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Finish an already-confirmed reset before mounting the hook that writes bakery v1.
    const restored = store.resumeReset();
    try {
      const bakery = JSON.parse(browserStorage.getItem(BAKERY_KEY));
      if (bakery?.version > 1) {
        setStatus({ ...restored, writable: false, message: "麵包店進度來自較新的版本，這次暫存遊玩，原始資料會保留。" });
      } else setStatus(restored);
    } catch { setStatus(restored); }
    const changed = event => {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (event.key === WORLD_KEY || event.key === null) setStatus(store.checkExternalChange());
      if (event.key === BAKERY_KEY) {
        // The world snapshot alone cannot detect a legacy-only write in another tab.
        setStatus(previous => ({ ...previous, writable: false, message: "另一個分頁已更新麵包店進度。請重新載入後繼續。" }));
      }
    };
    window.addEventListener("storage", changed);
    return () => { window.removeEventListener("storage", changed); stopSpeaking(); };
  }, [store]);

  if (!status) return <main className="bakery-app" aria-busy="true">正在準備冒險…</main>;
  return <Adventure store={store} status={status} onStatus={setStatus} />;
}
