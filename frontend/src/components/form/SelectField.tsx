import { useId } from 'react';
import { PillSelect, type PillOption } from '@/components/ui';
import { Field } from './Field';

interface SelectFieldProps {
  label: string;
  value: string;
  options: PillOption[];
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
}

/** The themed PillSelect with a field label, sized to sit next to text inputs. */
export function SelectField({ label, value, options, onChange, error, optional }: SelectFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} optional={optional}>
      <PillSelect label={label} value={value} options={options} onChange={onChange} size="field" className="w-full" />
    </Field>
  );
}
