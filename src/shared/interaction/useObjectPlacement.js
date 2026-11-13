import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

export function useObjectPlacement({ disabled, sourcePosition, plane, acceptsDrop, onDrop, onSelect }) {
  const drag = useRef(null);
  const ghost = useRef(null);
  const [dragId, setDragId] = useState(null);
  useEffect(() => {
    const cancel = () => {
      drag.current = null;
      setDragId(null);
      onSelect(null);
    };
    const multi = event => { if (!event.isPrimary) cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('pointerdown', multi);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('pointerdown', multi);
    };
  }, [onSelect]);
  const ghostPoint = drag.current?.point?.clone();
  if (ghostPoint) ghostPoint.y += 0.3;
  const sourceHandlers = id => ({
    onLostPointerCapture() {
      if (!drag.current) return;
      drag.current = null;
      setDragId(null);
      onSelect(null);
    },
    onPointerDown(event) {
      if (disabled || !event.nativeEvent.isPrimary || event.button !== 0) return;
      event.stopPropagation();
      drag.current = { id, pointer: event.pointerId, x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, moved: false, point: sourcePosition(id) };
      event.target.setPointerCapture(event.pointerId);
      onSelect(id);
    },
    onPointerMove(event) {
      const current = drag.current;
      if (!current || current.pointer !== event.pointerId) return;
      if (!current.moved && Math.hypot(event.nativeEvent.clientX - current.x, event.nativeEvent.clientY - current.y) < 8) return;
      current.moved = true;
      const point = event.ray.intersectPlane(plane, new Vector3());
      if (point) {
        current.point = point.clone();
        if (ghost.current) {
          ghost.current.position.copy(point);
          ghost.current.position.y += 0.3;
        }
      }
      setDragId(id);
    },
    onPointerUp(event) {
      const current = drag.current;
      if (!current || current.pointer !== event.pointerId) return;
      event.stopPropagation();
      drag.current = null;
      setDragId(null);
      event.target.releasePointerCapture(event.pointerId);
      if (current.moved) {
        if (!disabled && acceptsDrop(id, current.point)) onDrop(id, current.point);
        else onSelect(null);
      }
    },
  });
  return { dragId, ghost, ghostPoint, sourceHandlers };
}
