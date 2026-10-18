import { SelectField, TextAreaField, TextField } from '@/components/form';
import type { AgentMode } from '@/types';
import { AgentModePicker } from './AgentModePicker';
import { BudgetField } from './BudgetField';
import type { LeadFormErrors, LeadFormValues } from '../hooks/useAddLeadForm';
import {
  BEDROOM_OPTIONS,
  CHANNEL_OPTIONS,
  COMMUNITY_OPTIONS,
  PURPOSE_OPTIONS,
  SOURCE_OPTIONS,
  TIMELINE_OPTIONS,
} from './add-lead.options';

import { useTeam } from '../hooks/useLeads';

interface AddLeadFormProps {
  id: string;
  values: LeadFormValues;
  errors: LeadFormErrors;
  set: (field: keyof LeadFormValues) => (value: string) => void;
  onSubmit: () => void;
  formError?: string | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-title-small text-heading">{title}</legend>
      {children}
    </fieldset>
  );
}

export function AddLeadForm({ id, values, errors, set, onSubmit, formError }: AddLeadFormProps) {
  const { data: team = [] } = useTeam();
  const agentOptions = [
    { value: '', label: 'Auto-assign (Default)' },
    ...team.map((m) => ({ value: m.id, label: `${m.name} (${m.role.toLowerCase()})` })),
  ];

  return (
    <form
      id={id}
      noValidate
      className="flex flex-col gap-7 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Section title="Contact & Assignment">
        <TextField label="Full name" value={values.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="off" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" type="tel" placeholder="050 123 4567" value={values.phone} onChange={set('phone')} error={errors.phone} />
          <TextField label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} optional />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Instagram" placeholder="@handle" value={values.instagramHandle} onChange={set('instagramHandle')} optional />
          <SelectField label="Came via" value={values.source} options={SOURCE_OPTIONS} onChange={set('source')} />
          <SelectField label="Contact on" value={values.preferredChannel} options={CHANNEL_OPTIONS} onChange={set('preferredChannel')} />
        </div>
        <SelectField label="Assign to Agent" value={values.assignedToId} options={agentOptions} onChange={set('assignedToId')} />
      </Section>

      <Section title="What are they looking for?">
        <TextAreaField
          label="Enquiry notes"
          value={values.notes}
          onChange={set('notes')}
          error={errors.notes}
          rows={4}
          placeholder="e.g. Wants a 2BR with sea view in Dubai Marina, up to 2.4M, cash buyer, moving next month."
          hint="Write it as the client said it. Budget, area, bedrooms and timeline are read from it (by the AI only when the lead agent is AI)."
        />
        <p className="text-body-small text-muted">Quick details (optional; these override what the AI reads from the notes)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Purpose" value={values.purpose} options={PURPOSE_OPTIONS} onChange={set('purpose')} />
          <BudgetField
            label="Max budget"
            amount={values.budget}
            unit={values.budgetUnit}
            onAmountChange={set('budget')}
            onUnitChange={set('budgetUnit')}
            error={errors.budget}
          />
          <SelectField label="Bedrooms" value={values.bedrooms} options={BEDROOM_OPTIONS} onChange={set('bedrooms')} />
          <SelectField label="Area" value={values.community} options={COMMUNITY_OPTIONS} onChange={set('community')} />
          <SelectField label="Timeline" value={values.timeline} options={TIMELINE_OPTIONS} onChange={set('timeline')} />
        </div>
      </Section>

      <Section title="Lead agent">
        <AgentModePicker value={values.agentMode as AgentMode} onChange={(m) => set('agentMode')(m)} />
      </Section>

      {formError && (
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-body-medium text-danger" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}
