import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

/** Label + control + helper/error text, shared by every form input. */
export function Field({ id, label, error, hint, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-medium text-text">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-body-small text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-body-small text-muted">{hint}</p>
      )}
    </div>
  );
}
