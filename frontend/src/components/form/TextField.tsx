import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Field } from './Field';
import { inputClass } from './input-styles';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({ label, value, onChange, error, hint, optional, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass(Boolean(error)), 'min-h-12 rounded-full', className)}
        {...rest}
      />
    </Field>
  );
}
