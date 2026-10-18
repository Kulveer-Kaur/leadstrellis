import { useState } from 'react';
import { UAE_COMMUNITIES } from '@/constants/uae-communities';
import type { Channel, LeadDetail } from '@/types';
import type { LeadUpdate } from '../api/leads.api';
import type { RequirementInput } from '../leads.types';
import { fromAed, toAed } from '../utils/parse-budget';

/** Form values (all strings, as the inputs hold them) from the lead as it is now. */
function valuesFrom(lead: LeadDetail) {
  const r = lead.requirement;
  const [bMin, bMax] = [fromAed(r?.budgetMin), fromAed(r?.budgetMax)];
  return {
    fullName: lead.fullName,
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    instagramHandle: lead.instagramHandle ?? '',
    preferredChannel: lead.preferredChannel ?? '',
    purpose: r?.purpose ?? '',
    propertyType: r?.propertyTypes[0] ?? '',
    bedroomsMin: r?.bedroomsMin != null ? String(r.bedroomsMin) : '',
    bedroomsMax: r?.bedroomsMax != null ? String(r.bedroomsMax) : '',
    budgetMin: bMin.amount,
    budgetMinUnit: bMin.unit as string,
    budgetMax: bMax.amount,
    budgetMaxUnit: bMax.unit as string,
    community: r?.communities[0] ?? '',
    timeline: r && r.timeline !== 'UNKNOWN' ? r.timeline : '',
    financing: r?.financing ?? 'UNKNOWN',
    mustHaves: r?.mustHaves.join(', ') ?? '',
  };
}

export type EditLeadValues = ReturnType<typeof valuesFrom>;
export type EditLeadErrors = Partial<Record<keyof EditLeadValues, string>>;

const CONTACT_FIELDS = ['fullName', 'phone', 'email', 'instagramHandle', 'preferredChannel'] as const;

/** Edit form for a lead's contact details and requirements. Only changed fields are sent. */
export function useEditLeadForm(lead: LeadDetail) {
  const [initial] = useState(() => valuesFrom(lead));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<EditLeadErrors>({});

  const set = (field: keyof EditLeadValues) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const changed = (field: keyof EditLeadValues) => values[field].trim() !== initial[field].trim();

  /** Returns the two PATCH bodies (undefined when nothing in that part changed), or null if invalid. */
  const toPatches = (): { contact?: LeadUpdate; requirement?: RequirementInput } | null => {
    const next: EditLeadErrors = {};
    const email = values.email.trim();
    if (values.fullName.trim().length < 2) next.fullName = 'Enter the lead’s name';
    if (!values.phone.trim() && !email && !values.instagramHandle.trim()) next.phone = 'Keep at least a phone, email or Instagram handle';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email';
    else if (!email && lead.agentMode !== 'OFF') next.email = 'The lead agent sends proposals by email: keep an email, or switch the agent off first';
    const [bMin, bMax] = [toAed(values.budgetMin, values.budgetMinUnit), toAed(values.budgetMax, values.budgetMaxUnit)];
    if (values.budgetMin.trim() && !bMin) next.budgetMin = 'Enter a number, e.g. 1.5';
    if (values.budgetMax.trim() && !bMax) next.budgetMax = 'Enter a number, e.g. 2.5';
    if (bMin && bMax && bMin > bMax) next.budgetMin = 'Min budget is above the max';
    if (values.bedroomsMin && values.bedroomsMax && Number(values.bedroomsMin) > Number(values.bedroomsMax)) next.bedroomsMin = 'Min bedrooms is above the max';
    setErrors(next);
    if (Object.keys(next).length) return null;

    const contact: LeadUpdate = {};
    for (const f of CONTACT_FIELDS) {
      if (!changed(f)) continue;
      const v = values[f].trim();
      if (f === 'fullName') contact.fullName = v;
      else if (f === 'preferredChannel') contact.preferredChannel = (v || null) as Channel | null;
      else if (f === 'email') contact.email = v ? v.toLowerCase() : null;
      else contact[f] = v || null;
    }

    const req: RequirementInput = {};
    if (changed('purpose')) req.purpose = (values.purpose || null) as RequirementInput['purpose'];
    if (changed('propertyType')) req.propertyTypes = values.propertyType ? [values.propertyType as NonNullable<RequirementInput['propertyTypes']>[number]] : [];
    if (changed('bedroomsMin')) req.bedroomsMin = values.bedroomsMin ? Number(values.bedroomsMin) : null;
    if (changed('bedroomsMax')) req.bedroomsMax = values.bedroomsMax ? Number(values.bedroomsMax) : null;
    if (bMin !== (lead.requirement?.budgetMin ?? undefined)) req.budgetMin = bMin ?? null;
    if (bMax !== (lead.requirement?.budgetMax ?? undefined)) req.budgetMax = bMax ?? null;
    if (changed('community')) {
      req.communities = values.community ? [values.community] : [];
      req.emirate = UAE_COMMUNITIES.find((c) => c.name === values.community)?.emirate ?? null;
    }
    if (changed('timeline')) req.timeline = (values.timeline || 'UNKNOWN') as RequirementInput['timeline'];
    if (changed('financing')) req.financing = values.financing as RequirementInput['financing'];
    if (changed('mustHaves')) req.mustHaves = values.mustHaves.split(',').map((s) => s.trim()).filter(Boolean);

    return { contact: Object.keys(contact).length ? contact : undefined, requirement: Object.keys(req).length ? req : undefined };
  };

  return { values, errors, set, setErrors, toPatches };
}
