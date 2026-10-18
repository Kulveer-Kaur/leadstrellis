import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils/cn';
import { SelectOption } from './SelectOption';

export interface PillOption {
  value: string;
  label: string;
}

interface PillSelectProps {
  label: string;
  value: string;
  options: PillOption[];
  onChange: (value: string) => void;
  size?: 'md' | 'sm' | 'field';
  /** Which edge the menu lines up with. */
  align?: 'left' | 'right';
  className?: string;
}

/** Themed single-select dropdown (ARIA listbox pattern). */
export function PillSelect({ label, value, options, onChange, size = 'md', align = 'left', className }: PillSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  const openMenu = () => {
    setActive(selectedIndex);
    setOpen(true);
    requestAnimationFrame(() => listRef.current?.focus());
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => {
        setOpen(false);
        buttonRef.current?.focus();
      },
      Tab: () => setOpen(false),
    };
    const action = keys[e.key];
    if (!action) return;
    if (e.key !== 'Tab') e.preventDefault();
    action();
  };

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${options[selectedIndex]?.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp') && (e.preventDefault(), openMenu())}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-3 rounded-full border bg-surface text-heading transition-colors',
          open ? 'border-primary' : 'border-border hover:border-border-strong',
          size === 'md' && 'min-h-14 pr-4 pl-6 text-body-large',
          size === 'field' && 'min-h-12 pr-4 pl-5 text-body-large',
          size === 'sm' && 'min-h-10 pr-3 pl-4 text-label-large',
        )}
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <ChevronDown className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          className={cn(
            'absolute top-full z-50 mt-2 flex max-h-72 w-max min-w-full animate-fade-up flex-col gap-0.5 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-float outline-none scrollbar-thin',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((o, i) => (
            <SelectOption
              key={o.value}
              id={`${id}-${i}`}
              label={o.label}
              selected={i === selectedIndex}
              active={i === active}
              onSelect={() => choose(i)}
              onHover={() => setActive(i)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
