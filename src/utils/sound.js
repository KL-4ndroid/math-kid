let context;
export function unlockAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    context ||= new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  } catch { return null; }
}
export function playSound(kind = 'pop') {
  const audio = unlockAudio();
  if (!audio) return;
  const notes = kind === 'correct' ? [523.25, 659.25, 783.99, 1046.5] : [620];
  notes.forEach((frequency, i) => {
    const start = audio.currentTime + i * 0.12;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (kind === 'pop') oscillator.frequency.exponentialRampToValueAtTime(310, start + 0.12);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.32);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => /zh[-_]TW/i.test(v.lang)) || voices.find((v) => /^zh/i.test(v.lang));
  if (voice) utterance.voice = voice;
  utterance.lang = 'zh-TW';
  utterance.rate = 0.82;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}
