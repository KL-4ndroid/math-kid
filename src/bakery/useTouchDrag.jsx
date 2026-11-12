import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { isInsideDropZone } from "./touchGeometry.js";

export default function useTouchDrag({
  disabled,
  item,
  destination,
  onDrop,
  onStart,
  onCancel,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [overDrop, setOverDrop] = useState(false);
  const session = useRef(null);
  const ghost = useRef();
  const suppressClick = useRef(false);
  const callbacks = useRef({ onDrop, onStart, onCancel });
  callbacks.current = { onDrop, onStart, onCancel };

  function releaseCapture(current) {
    try {
      if (current.element.hasPointerCapture(current.pointerId))
        current.element.releasePointerCapture(current.pointerId);
    } catch {
      /* A cancelled browser gesture may already have released capture. */
    }
  }
  function cancel() {
    const current = session.current;
    if (!current) return;
    session.current = null;
    releaseCapture(current);
    setDraggingId(null);
    setOverDrop(false);
    if (current.moved) {
      suppressClick.current = true;
      callbacks.current.onCancel?.();
    }
  }
  useEffect(() => {
    function hide() {
      if (document.hidden) cancel();
    }
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hide);
      const current = session.current;
      session.current = null;
      if (current) releaseCapture(current);
    };
  }, []);
  function positionGhost() {
    const current = session.current;
    if (ghost.current && current)
      ghost.current.style.transform = `translate3d(${current.x - 27}px, ${current.y - 48}px, 0)`;
  }
  useLayoutEffect(() => {
    positionGhost();
  }, [draggingId]);
  function onPointerDown(event, id) {
    if (
      disabled ||
      event.pointerType === "mouse" ||
      !event.isPrimary ||
      session.current ||
      event.button !== 0
    )
      return;
    suppressClick.current = false;
    session.current = {
      id,
      pointerId: event.pointerId,
      element: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      over: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Native capture is optional for synthesized pointer events. */
    }
  }
  function onPointerMove(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (
      !current.moved &&
      Math.hypot(current.x - current.startX, current.y - current.startY) < 8
    )
      return;
    event.preventDefault();
    if (!current.moved) {
      current.moved = true;
      setDraggingId(current.id);
      callbacks.current.onStart?.();
    }
    const over = isInsideDropZone(
      current.x,
      current.y,
      destination.current?.getBoundingClientRect(),
    );
    if (over !== current.over) {
      current.over = over;
      setOverDrop(over);
    }
    positionGhost();
  }
  function onPointerUp(event) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    session.current = null;
    releaseCapture(current);
    setDraggingId(null);
    setOverDrop(false);
    if (!current.moved) return;
    event.preventDefault();
    suppressClick.current = true;
    const valid =
      !disabled &&
      isInsideDropZone(
        event.clientX,
        event.clientY,
        destination.current?.getBoundingClientRect(),
      );
    if (valid)
      callbacks.current.onDrop(current.id, {
        left: current.x - 27,
        top: current.y - 48,
        width: 54,
        height: 54,
      });
    else callbacks.current.onCancel?.();
  }
  function onPointerCancel(event) {
    if (session.current?.pointerId === event.pointerId) cancel();
  }
  return {
    draggingId,
    overDrop,
    isTouchSession: () => !!session.current,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onNewInput: (event) => {
      if (
        event.type === "pointerdown" &&
        event.isPrimary === false &&
        session.current
      ) {
        cancel();
        return;
      }
      suppressClick.current = false;
    },
    onClickCapture: (event) => {
      if (session.current || suppressClick.current) {
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    ghost:
      draggingId !== null
        ? createPortal(
            <span ref={ghost} className="bk-touch-ghost" aria-hidden="true">
              {item}
            </span>,
            document.body,
          )
        : null,
  };
}
