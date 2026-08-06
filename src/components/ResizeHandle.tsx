import { useRef } from 'react';

interface Props {
  direction: 'horizontal' | 'vertical';
  min: number;
  max: number;
  current: number;
  /**
   * Which edge of the parent the handle sits on, and what direction widens the parent.
   * - `right` (default, horizontal): handle on right edge, drag-right = widen
   * - `left` (horizontal): handle on left edge, drag-LEFT = widen (for a panel on the right of the viewport)
   * - `bottom` (vertical): handle on bottom, drag-down = grow
   */
  side?: 'right' | 'left' | 'bottom';
  onResize: (next: number) => void;
}

export function ResizeHandle({ direction, min, max, current, side, onResize }: Props) {
  const start = useRef<{ pos: number; size: number } | null>(null);
  const edge: 'right' | 'left' | 'bottom' =
    side ?? (direction === 'horizontal' ? 'right' : 'bottom');

  const onMouseDown = (e: React.MouseEvent) => {
    start.current = {
      pos: direction === 'horizontal' ? e.clientX : e.clientY,
      size: current,
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  const onMove = (e: MouseEvent) => {
    if (!start.current) return;
    const pos = direction === 'horizontal' ? e.clientX : e.clientY;
    const rawDelta = pos - start.current.pos;
    // On the left edge, dragging left (negative delta) should widen the parent.
    const delta = edge === 'left' ? -rawDelta : rawDelta;
    const next = Math.min(max, Math.max(min, start.current.size + delta));
    onResize(next);
  };

  const onUp = () => {
    start.current = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
  };

  const styles =
    edge === 'right'
      ? 'absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-interactive/40'
      : edge === 'left'
      ? 'absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-interactive/40 z-10'
      : 'absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-interactive/40';

  return <div className={styles} onMouseDown={onMouseDown} />;
}
