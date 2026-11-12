export const islandsData = [
  { id: 1, name: '數數森林', mode: 'counting', emoji: '🌳', color: '#8cdda7', position: [-5, 0, 2] },
  { id: 2, name: '形狀城堡', mode: 'shapes', emoji: '🏰', color: '#c5b3f6', position: [-3, 0.4, -2] },
  { id: 3, name: '比大小牧場', mode: 'comparison', emoji: '🍄', color: '#ffc398', position: [1, 0.7, -3] },
  { id: 4, name: '加法麵包屋', mode: 'addition', emoji: '🥐', color: '#f6d587', position: [5, 0.3, -1] },
  { id: 5, name: '規律彩虹橋', mode: 'patterns', emoji: '🌈', color: '#f7b4ce', position: [5, 0, 3.5] },
];
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const integer = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = integer(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const numbers = (answer) => shuffle([
  answer, ...shuffle([1, 2, 3, 4, 5].filter((n) => n !== answer)).slice(0, 2),
]);
export function generateQuestion(mode) {
  if (mode === 'counting') {
    const count = integer(1, 5);
    return { mode, text: '一起數一數，有幾個呢？', emoji: pick(['🍎', '🐰', '🍓', '🐥']), count, answer: count, options: numbers(count) };
  }
  if (mode === 'shapes') {
    const options = shuffle(['🔺', '🟦', '🟡']);
    const answer = pick(options);
    const names = { '🔺': '三角形', '🟦': '正方形', '🟡': '圓形' };
    return { mode, text: `找找看，哪一個是${names[answer]}？`, answer, options, names };
  }
  if (mode === 'comparison') {
    const counts = shuffle([1, 2, 3, 4, 5]).slice(0, 2);
    return { mode, text: '哪一邊的點心比較多？', emoji: pick(['🍪', '🍩', '🧁']), counts, answer: counts[0] > counts[1] ? 0 : 1, options: [0, 1] };
  }
  if (mode === 'addition') {
    const a = integer(1, 4), b = integer(1, 5 - a);
    return { mode, text: `${a}個草莓，加上${b}個草莓，一共有幾個？`, emoji: '🍓', a, b, answer: a + b, options: numbers(a + b) };
  }
  if (mode === 'patterns') {
    const options = shuffle(pick([['🔴', '🟡', '🔵'], ['🔺', '🟦', '🟡']]));
    const [a, b] = options;
    const sequence = Math.random() < 0.5 ? [a, b, a, b] : [a, a, b, a, a];
    return { mode, text: '找找規律，下一個是什麼呢？', sequence, answer: sequence.length === 4 ? a : b, options };
  }
  throw new Error(`Unknown game mode: ${mode}`);
}
