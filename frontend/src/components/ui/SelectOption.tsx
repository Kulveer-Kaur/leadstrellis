import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelectOptionProps {
  id: string;
  label: string;
  selected: boolean;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export function SelectOption({ id, label, selected, active, onSelect, onHover }: SelectOptionProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3.5 text-label-large whitespace-nowrap transition-colors',
        active && 'bg-surface-2',
        selected ? 'text-primary' : 'text-heading',
      )}
    >
      {label}
      <Check className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} strokeWidth={2.25} aria-hidden />
    </li>
  );
}
