import { useState } from 'react';
import type { AgentMode, Channel, LeadSource } from '@/types';
import { UAE_COMMUNITIES } from '@/constants/uae-communities';
import type { CreateLeadInput, RequirementInput } from '../leads.types';
import { toAed } from '../utils/parse-budget';

export const EMPTY_LEAD_FORM = {
  fullName: '',
  phone: '',
  email: '',
  instagramHandle: '',
  source: 'MANUAL',
  preferredChannel: '',
  notes: '',
  purpose: '',
  budget: '',
  /** M / K / AED: scales the amount; the budget itself is always AED. */
  budgetUnit: 'M',
  bedrooms: '',
  community: '',
  timeline: '',
  assignedToId: '',
  /** Who works the lead from the start: OFF (default, no tokens), RULES or AI. */
  agentMode: 'OFF',
};

export type LeadFormValues = typeof EMPTY_LEAD_FORM;
export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>;

/** Form state, client-side checks, and mapping to the POST /leads body. */
export function useAddLeadForm() {
  const [values, setValues] = useState<LeadFormValues>(EMPTY_LEAD_FORM);
  const [errors, setErrors] = useState<LeadFormErrors>({});

  const set = (field: keyof LeadFormValues) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const requirement = (): RequirementInput | undefined => {
    const r: RequirementInput = {};
    if (values.purpose) r.purpose = values.purpose as RequirementInput['purpose'];
    if (values.bedrooms) {
      const n = Number(values.bedrooms);
      r.bedroomsMin = n;
      r.bedroomsMax = n;
      if (n === 0) r.propertyTypes = ['STUDIO'];
    }
    const budget = toAed(values.budget, values.budgetUnit);
    if (budget) r.budgetMax = budget;
    if (values.community) {
      r.communities = [values.community];
      r.emirate = UAE_COMMUNITIES.find((c) => c.name === values.community)?.emirate ?? null;
    }
    if (values.timeline) r.timeline = values.timeline as RequirementInput['timeline'];
    return Object.keys(r).length ? r : undefined;
  };

  /** Returns the request body, or null (and sets errors) if the form is not valid. */
  const toInput = (): CreateLeadInput | null => {
    const next: LeadFormErrors = {};
    if (values.fullName.trim().length < 2) next.fullName = 'Enter the lead’s name';
    if (!values.phone.trim() && !values.email.trim() && !values.instagramHandle.trim()) next.phone = 'Add a phone, email or Instagram handle';
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Enter a valid email';
    else if (values.agentMode !== 'OFF' && !values.email.trim()) next.email = 'The proposal is sent by email: add an email, or set the lead agent to Off';
    if (values.budget.trim() && !toAed(values.budget, values.budgetUnit)) next.budget = 'Enter a number, e.g. 2.5';
    const req = requirement();
    if (!values.notes.trim() && !req) next.notes = 'Describe what they are looking for, or fill a quick detail below';
    setErrors(next);
    if (Object.keys(next).length) return null;

    return {
      fullName: values.fullName.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      instagramHandle: values.instagramHandle.trim() || undefined,
      source: values.source as LeadSource,
      preferredChannel: (values.preferredChannel || undefined) as Channel | undefined,
      notes: values.notes.trim() || undefined,
      requirement: req,
      assignedToId: values.assignedToId.trim() || undefined,
      agentMode: values.agentMode as AgentMode,
    };
  };

  const reset = () => {
    setValues(EMPTY_LEAD_FORM);
    setErrors({});
  };

  return { values, errors, set, setErrors, toInput, reset };
}
