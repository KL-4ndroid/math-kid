export function isInsideDropZone(x, y, rect, padding = 12) {
  return (
    !!rect &&
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  );
}
