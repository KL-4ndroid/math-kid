import { useEffect, useState } from "react";
import { isVoiceActive } from "../utils/sound.js";

export function useVoiceActivity() {
  const [speaking, setSpeaking] = useState(isVoiceActive);
  useEffect(() => {
    const sync = () => setSpeaking(isVoiceActive());
    window.addEventListener("magic-math-voice", sync);
    sync();
    return () => window.removeEventListener("magic-math-voice", sync);
  }, []);
  return speaking;
}

export default function FoxBuddy({
  size = "medium",
  mood = "idle",
  speaking = false,
}) {
  return (
    <span
      className={`fox-buddy fox-${size} fox-${mood} ${speaking ? "fox-speaking" : ""}`}
      aria-hidden="true"
    >
      <span className="fox-tail" />
      <span className="fox-body">
        <span className="fox-apron" />
      </span>
      <span className="fox-ear ear-left" />
      <span className="fox-ear ear-right" />
      <span className="fox-head">
        <span className="fox-cheek cheek-left" />
        <span className="fox-cheek cheek-right" />
        <span className="fox-eye eye-left" />
        <span className="fox-eye eye-right" />
        <span className="fox-nose" />
        <span className="fox-mouth" />
      </span>
      <span className="fox-paw paw-left" />
      <span className="fox-paw paw-right" />
    </span>
  );
}

export function Celebration() {
  return (
    <div className="bk-celebration" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={{
            "--piece-x": `${8 + ((i * 37) % 84)}%`,
            "--piece-delay": `${(i % 4) * 0.07}s`,
            "--piece-turn": `${i * 41}deg`,
          }}
        >
          {i % 3 ? "✦" : "●"}
        </span>
      ))}
    </div>
  );
}
