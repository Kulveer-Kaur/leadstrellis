import { cn } from '@/utils/cn';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'size-8 text-label-medium',
  md: 'size-10 text-label-large',
  lg: 'size-14 text-label-large',
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-primary',
        SIZES[size],
        className,
      )}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <span aria-hidden>{initials(name)}</span>}
      <span className="sr-only">{name}</span>
    </span>
  );
}
