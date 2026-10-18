import { useId } from 'react';
import { Field } from '@/components/form';
import { inputClass } from '@/components/form/input-styles';
import { PillSelect } from '@/components/ui';
import { cn } from '@/utils/cn';
import { BUDGET_UNIT_OPTIONS, budgetPreview, cleanAmount } from '../utils/parse-budget';

interface BudgetFieldProps {
  label: string;
  amount: string;
  unit: string;
  onAmountChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  error?: string;
  optional?: boolean;
}

/** AED budget: a numbers-only amount plus a Million / Thousand / AED unit, with the full figure shown below. */
export function BudgetField({ label, amount, unit, onAmountChange, onUnitChange, error, optional }: BudgetFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={budgetPreview(amount, unit) ?? 'Amount in AED'} optional={optional}>
      <div className="flex gap-2">
        <input
          id={id}
          value={amount}
          onChange={(e) => onAmountChange(cleanAmount(e.target.value))}
          inputMode="decimal"
          placeholder="2.5"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass(Boolean(error)), 'num min-h-12 min-w-0 flex-1 rounded-full')}
        />
        <PillSelect label={`${label} unit`} value={unit} options={BUDGET_UNIT_OPTIONS} onChange={onUnitChange} size="field" align="right" className="w-32 shrink-0" />
      </div>
    </Field>
  );
}
