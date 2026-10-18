import { useState } from 'react';
import { SelectField, TextField } from '@/components/form';
import { Button, Modal } from '@/components/ui';
import { ApiError } from '@/services/http';
import type { LeadDetail } from '@/types';
import { useUpdateLead, useUpdateRequirement } from '../../hooks/useLeadMutations';
import { useEditLeadForm, type EditLeadErrors } from '../../hooks/useEditLeadForm';
import { BudgetField } from '../BudgetField';
import {
  BEDROOM_OPTIONS,
  CHANNEL_OPTIONS,
  COMMUNITY_OPTIONS,
  FINANCING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
} from '../add-lead.options';

const FORM_ID = 'edit-lead-form';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-title-small text-heading">{title}</legend>
      {hint && <p className="-mt-1 text-body-small text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

/** Edit a lead's contact details and what they are looking for. Requirement changes re-score and re-match. */
export function EditLeadModal({ lead, onClose }: { lead: LeadDetail; onClose: () => void }) {
  const form = useEditLeadForm(lead);
  const updateLead = useUpdateLead(lead.id);
  const updateRequirement = useUpdateRequirement(lead.id);
  const [formError, setFormError] = useState<string | null>(null);
  const saving = updateLead.isPending || updateRequirement.isPending;
  const { values, errors, set } = form;

  // Keep an area the AI read that is not in the standard list selectable.
  const communityOptions =
    values.community && !COMMUNITY_OPTIONS.some((o) => o.value === values.community)
      ? [...COMMUNITY_OPTIONS, { value: values.community, label: values.community }]
      : COMMUNITY_OPTIONS;

  const submit = async () => {
    setFormError(null);
    const patches = form.toPatches();
    if (!patches) return;
    try {
      if (patches.contact) await updateLead.mutateAsync(patches.contact);
      if (patches.requirement) await updateRequirement.mutateAsync(patches.requirement);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) form.setErrors(err.fieldErrors as EditLeadErrors);
      setFormError(err instanceof ApiError ? err.message : 'Could not save the changes.');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${lead.fullName}`}
      description={`${lead.code} · changes to what they want re-score the lead and refresh its matches.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving} className="disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        className="flex flex-col gap-7 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Section title="Contact">
          <TextField label="Full name" value={values.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="off" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone" type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} optional />
            <TextField label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} optional />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Instagram" placeholder="@handle" value={values.instagramHandle} onChange={set('instagramHandle')} optional />
            <SelectField label="Contact on" value={values.preferredChannel} options={CHANNEL_OPTIONS} onChange={set('preferredChannel')} />
          </div>
        </Section>

        <Section title="What they want" hint="Saved as entered by an agent; the AI uses these instead of its own reading.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Purpose" value={values.purpose} options={PURPOSE_OPTIONS} onChange={set('purpose')} />
            <SelectField label="Property type" value={values.propertyType} options={PROPERTY_TYPE_OPTIONS} onChange={set('propertyType')} />
            <SelectField label="Min bedrooms" value={values.bedroomsMin} options={BEDROOM_OPTIONS} onChange={set('bedroomsMin')} error={errors.bedroomsMin} />
            <SelectField label="Max bedrooms" value={values.bedroomsMax} options={BEDROOM_OPTIONS} onChange={set('bedroomsMax')} />
            <BudgetField
              label="Min budget"
              amount={values.budgetMin}
              unit={values.budgetMinUnit}
              onAmountChange={set('budgetMin')}
              onUnitChange={set('budgetMinUnit')}
              error={errors.budgetMin}
              optional
            />
            <BudgetField
              label="Max budget"
              amount={values.budgetMax}
              unit={values.budgetMaxUnit}
              onAmountChange={set('budgetMax')}
              onUnitChange={set('budgetMaxUnit')}
              error={errors.budgetMax}
            />
            <SelectField label="Area" value={values.community} options={communityOptions} onChange={set('community')} />
            <SelectField label="Timeline" value={values.timeline} options={TIMELINE_OPTIONS} onChange={set('timeline')} />
            <SelectField label="Financing" value={values.financing} options={FINANCING_OPTIONS} onChange={set('financing')} />
            <TextField label="Must have" placeholder="Sea view, parking" value={values.mustHaves} onChange={set('mustHaves')} hint="Separate with commas" optional />
          </div>
        </Section>

        {formError && (
          <p className="rounded-2xl bg-danger-soft px-4 py-3 text-body-medium text-danger" role="alert">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
