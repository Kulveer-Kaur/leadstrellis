import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Field } from './Field';
import { inputClass } from './input-styles';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextAreaField({ label, value, onChange, error, hint, optional, className, rows = 4, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass(Boolean(error)), 'resize-y rounded-2xl py-3', className)}
        {...rest}
      />
    </Field>
  );
}
