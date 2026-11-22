import { useRef, useState, type PointerEvent } from 'react';

const IGNORE = 'input, textarea, select, [data-noswipe]';

/**
 * Horizontales Wischen: links = weiter, rechts = zurück.
 * Liefert den aktuellen Versatz (für die Animation) und die Pointer-Handler.
 */
export function useSwipe({ onLeft, onRight, canLeft, canRight }: { onLeft: () => void; onRight: () => void; canLeft: boolean; canRight: boolean }) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const locked = useRef<'h' | 'v' | null>(null);
  const [dx, setDx] = useState(0);

  const reset = () => {
    start.current = null;
    locked.current = null;
    setDx(0);
  };

  return {
    dx,
    handlers: {
      onPointerDown(e: PointerEvent) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if ((e.target as HTMLElement).closest(IGNORE)) return;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        locked.current = null;
      },
      onPointerMove(e: PointerEvent) {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const x = e.clientX - s.x;
        const y = e.clientY - s.y;
        if (!locked.current && Math.hypot(x, y) > 10) locked.current = Math.abs(x) > Math.abs(y) * 1.2 ? 'h' : 'v';
        if (locked.current !== 'h') return;
        // Gummiband-Effekt, wenn in diese Richtung nicht gewischt werden darf
        const allowed = (x < 0 && canLeft) || (x > 0 && canRight);
        setDx(allowed ? x : x * 0.2);
      },
      onPointerUp() {
        const x = dx;
        const wasH = locked.current === 'h';
        reset();
        if (!wasH) return;
        if (x < -70 && canLeft) onLeft();
        else if (x > 70 && canRight) onRight();
      },
      onPointerCancel: reset,
    },
  };
}
