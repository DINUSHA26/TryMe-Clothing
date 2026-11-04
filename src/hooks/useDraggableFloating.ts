"use client";

import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";

interface UseDraggableFloatingOptions {
  defaultCorner: "bottom-right" | "bottom-left";
  width?: number;
  height?: number;
  storageKey?: string;
}

export function useDraggableFloating({
  defaultCorner = "bottom-right",
  width = 56,
  height = 56,
  storageKey,
}: UseDraggableFloatingOptions) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const movedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Initialize position based on screen dimensions and saved state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const calcDefault = () => {
      const x = defaultCorner === "bottom-right" ? window.innerWidth - width - 24 : 24;
      const y = window.innerHeight - height - 24;
      return { x, y };
    };

    let initial = calcDefault();

    if (storageKey) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            const clampedX = Math.max(12, Math.min(window.innerWidth - width - 12, parsed.x));
            const clampedY = Math.max(12, Math.min(window.innerHeight - height - 12, parsed.y));
            initial = { x: clampedX, y: clampedY };
          }
        }
      } catch {}
    }

    setPosition(initial);

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return calcDefault();
        return {
          x: Math.max(12, Math.min(window.innerWidth - width - 12, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - height - 12, prev.y)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [defaultCorner, width, height, storageKey]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || !position) return;

      activePointerIdRef.current = e.pointerId;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      isDraggingRef.current = true;
      movedRef.current = false;
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: position.x,
        initY: position.y,
      };
    },
    [position]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      if (!movedRef.current && Math.hypot(dx, dy) > 6) {
        movedRef.current = true;
      }

      if (movedRef.current) {
        const newX = Math.max(12, Math.min(window.innerWidth - width - 12, dragStartRef.current.initX + dx));
        const newY = Math.max(12, Math.min(window.innerHeight - height - 12, dragStartRef.current.initY + dy));
        setPosition({ x: newX, y: newY });
      }
    },
    [width, height]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      if (activePointerIdRef.current !== null) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(activePointerIdRef.current);
        } catch {}
        activePointerIdRef.current = null;
      }

      isDraggingRef.current = false;
      dragStartRef.current = null;

      if (movedRef.current && storageKey && position) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(position));
        } catch {}
      }
    },
    [storageKey, position]
  );

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  }, []);

  const dragStyle: CSSProperties = {
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    cursor: "grab",
  };

  return {
    position,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
    dragStyle,
  };
}
