import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'ghost' | 'outline' | 'primary' | 'soft' | 'surface';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  ghost: 'text-text hover:bg-surface-2',
  outline: 'border border-border-strong text-text hover:bg-surface-2',
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  soft: 'bg-surface-2 text-text hover:bg-track',
  surface: 'bg-surface text-heading shadow-soft hover:bg-white',
};

const SIZES: Record<Size, string> = {
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-12',
};

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
