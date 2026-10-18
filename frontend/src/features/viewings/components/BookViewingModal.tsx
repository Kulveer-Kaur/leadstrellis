import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { SelectField, TextField } from '@/components/form';
import { Button, Modal } from '@/components/ui';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { ApiError } from '@/services/http';
import { useCreateViewing } from '../hooks/useViewings';

interface BookViewingModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  /** The lead's matched properties, listed first. */
  properties: { id: string; label: string }[];
  defaultPropertyId?: string;
}

/** Tomorrow at 11:00, local time, in the format datetime-local expects. */
function defaultSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function BookViewingModal({ open, onClose, leadId, leadName, properties, defaultPropertyId }: BookViewingModalProps) {
  const { data: available } = useProperties({ status: 'AVAILABLE', pageSize: 100 });
  const matchedIds = new Set(properties.map((p) => p.id));
  const options = [
    ...properties.map((p) => ({ value: p.id, label: `★ ${p.label}` })),
    ...(available?.data ?? []).filter((p) => !matchedIds.has(p.id)).map((p) => ({ value: p.id, label: `${p.title} · ${p.community}` })),
  ];
  const [picked, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? '');
  const propertyId = picked || options[0]?.value || '';
  const [when, setWhen] = useState(defaultSlot);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateViewing();

  const submit = () => {
    setError(null);
    if (!propertyId) return setError('Pick a property.');
    if (new Date(when).getTime() < Date.now()) return setError('Pick a time in the future.');
    create.mutate(
      { leadId, propertyId, scheduledAt: new Date(when).toISOString(), notes: notes.trim() || undefined },
      { onSuccess: onClose, onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not book the viewing.') },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book a viewing"
      description={`For ${leadName}. The lead moves to Viewing once it's booked.`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending} icon={<CalendarPlus className="size-4" aria-hidden />}>
            {create.isPending ? 'Booking…' : 'Book viewing'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <SelectField
          label="Property"
          value={propertyId}
          options={options.length ? options : [{ value: '', label: 'Loading listings…' }]}
          onChange={setPropertyId}
        />
        {properties.length > 0 && <p className="-mt-2 text-body-small text-muted">★ marks the AI's matches for this lead.</p>}
        <TextField label="Date and time" type="datetime-local" value={when} onChange={setWhen} />
        <TextField label="Notes" optional value={notes} onChange={setNotes} placeholder="Parking, access code, who to meet…" />
        {error && (
          <p role="alert" className="text-body-small text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
