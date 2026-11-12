export function snackFlightFrames(from, to) {
  const dx = to.left + to.width / 2 - from.left - from.width / 2;
  const dy = to.top + to.height / 2 - from.top - from.height / 2;
  return [
    { transform: "translate(0px, 0px) scale(0.9)" },
    {
      transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 38}px) scale(1.12)`,
      offset: 0.5,
    },
    { transform: `translate(${dx}px, ${dy}px) scale(1)` },
  ];
}
