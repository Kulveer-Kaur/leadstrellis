/** Shared look for text inputs: pill shape, 16px text (no iOS zoom), theme border and focus. */
export const inputClass = (invalid?: boolean) =>
  [
    'w-full border bg-surface px-5 text-body-large text-heading placeholder:text-muted transition-colors',
    'focus:border-primary focus:outline-none',
    invalid ? 'border-danger' : 'border-border hover:border-border-strong',
  ].join(' ');
