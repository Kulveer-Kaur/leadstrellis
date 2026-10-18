import { useEffect, type RefObject } from 'react';

/** Calls `handler` on a pointer press outside `ref` while `active` is true. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [ref, handler, active]);
}
