import test from 'node:test';
import assert from 'node:assert/strict';
import { speak, stopSpeaking, isVoiceActive } from '../src/utils/sound.js';

test('speech completion, cancellation and late callbacks preserve the active utterance', async () => {
  const previousWindow = globalThis.window;
  const previousUtterance = globalThis.SpeechSynthesisUtterance;
  const utterances = [];
  globalThis.window = {
    dispatchEvent() {},
    speechSynthesis: {
      cancel() {},
      getVoices: () => [],
      speak: utterance => utterances.push(utterance),
    },
  };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  try {
    let starts = 0;
    const first = speak('1', { onStart: () => starts++ });
    utterances[0].onstart();
    assert.equal(starts, 1);
    assert.equal(isVoiceActive(), true);
    const second = speak('2');
    assert.equal(await first, false);
    utterances[1].onstart();
    utterances[0].onend();
    assert.equal(isVoiceActive(), true);
    utterances[1].onend();
    assert.equal(await second, true);
    utterances[1].onstart();
    assert.equal(isVoiceActive(), false);
    const third = speak('3');
    stopSpeaking();
    assert.equal(await third, false);
    delete window.speechSynthesis;
    assert.equal(await speak('4', { onStart: () => starts++ }), true);
    assert.equal(starts, 2);
  } finally {
    stopSpeaking();
    globalThis.window = previousWindow;
    globalThis.SpeechSynthesisUtterance = previousUtterance;
  }
});
