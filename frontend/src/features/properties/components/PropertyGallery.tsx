import { useState } from 'react';
import { cn } from '@/utils/cn';

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="h-72 rounded-card bg-surface-2" aria-hidden />;
  return (
    <div className="flex flex-col gap-3">
      <img src={images[active]} alt={`${title}, photo ${active + 1} of ${images.length}`} className="h-72 w-full rounded-card bg-surface-2 object-cover sm:h-96" />
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === active}
              className={cn('shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 transition', i === active ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100')}
            >
              <img src={src} alt="" loading="lazy" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
