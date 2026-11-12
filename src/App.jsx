import { useEffect } from "react";
import BakeryChapter from "./bakery/BakeryChapter.jsx";
import { stopSpeaking } from "./utils/sound.js";
import { useBakeryProgress } from "./bakery/progress.js";
import "./App.css";

export default function App() {
  const [progress, setProgress, saved] = useBakeryProgress();

  useEffect(() => () => stopSpeaking(), []);

  return (
    <main className="bakery-app">
      <BakeryChapter
        progress={progress}
        setProgress={setProgress}
        saved={saved}
        onClose={stopSpeaking}
      />
    </main>
  );
}
