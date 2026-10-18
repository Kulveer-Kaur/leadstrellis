import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { ApiError } from '@/services/http';
import { useAddLeadForm, type LeadFormErrors } from '../hooks/useAddLeadForm';
import { useCreateLead } from '../hooks/useCreateLead';
import type { CreatedLead } from '../leads.types';
import { AddLeadForm } from './AddLeadForm';

const FORM_ID = 'add-lead-form';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: CreatedLead) => void;
}

/** Manual lead capture: saves the lead, then the AI pipeline takes over on the server. */
export function AddLeadModal({ open, onClose, onCreated }: AddLeadModalProps) {
  const form = useAddLeadForm();
  const create = useCreateLead();
  const [formError, setFormError] = useState<string | null>(null);

  const close = () => {
    form.reset();
    setFormError(null);
    onClose();
  };

  const submit = () => {
    setFormError(null);
    const input = form.toInput();
    if (!input) return;
    create.mutate(input, {
      onSuccess: (lead) => {
        onCreated(lead);
        close();
      },
      onError: (err) => {
        if (err instanceof ApiError && Object.keys(err.fieldErrors).length) form.setErrors(err.fieldErrors as LeadFormErrors);
        setFormError(err instanceof ApiError ? err.message : 'Could not save the lead.');
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a lead"
      description="Walk-ins, referrals and phone enquiries. The AI qualifies and follows up automatically."
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={create.isPending} className="disabled:cursor-not-allowed disabled:opacity-60">
            {create.isPending ? 'Saving…' : 'Add lead'}
          </Button>
        </>
      }
    >
      <AddLeadForm id={FORM_ID} values={form.values} errors={form.errors} set={form.set} onSubmit={submit} formError={formError} />
    </Modal>
  );
}
