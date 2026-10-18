import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'outline' | 'soft' | 'glass';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  outline: 'border border-border-strong bg-surface text-heading hover:bg-surface-2',
  soft: 'bg-surface-2 text-heading hover:bg-track',
  glass: 'bg-surface/95 text-heading shadow-float backdrop-blur hover:bg-white',
};

export function Button({
  variant = 'primary',
  icon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-label-large transition-colors',
        trailingIcon && 'pr-1.5',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}
