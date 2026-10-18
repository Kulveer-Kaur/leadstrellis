import type { LeadProfile, ListingView } from '../context/ai-context.types.js';
import { runJsonTask } from '../guards/run-json-task.js';
import { COMPOSE_PROPOSAL_PROMPT_VERSION, composeProposalSystemPrompt, composeProposalUserPrompt } from '../prompts/compose-proposal.prompt.js';
import { composeProposalSchema, type ComposeProposalOutput } from '../schemas/compose-proposal.schema.js';
import { formatAed } from '../../utils/currency.js';

export interface ComposeProposalInput {
  lead: LeadProfile;
  best: ListingView;
  address: string;
  alternatives: ListingView[];
  /** Site-visit times, already formatted in Dubai time. */
  slots: string[];
  agentName: string;
  /** False = template proposal, no AI tokens. */
  useAi?: boolean;
}

/** Writes the proposal text (headline, intro, why it fits, next steps) and its covering email. */
export async function composeProposal(i: ComposeProposalInput) {
  const result = await runJsonTask({
    task: 'compose-proposal',
    promptVersion: COMPOSE_PROPOSAL_PROMPT_VERSION,
    system: composeProposalSystemPrompt(i.agentName),
    user: composeProposalUserPrompt(i.lead, i.best, i.address, i.alternatives, i.slots),
    schema: composeProposalSchema,
    fallback: () => proposalTemplate(i),
    useAi: i.useAi,
  });
  const d = result.data;
  return {
    ...d,
    headline: d.headline.slice(0, 120),
    whyItFits: d.whyItFits.slice(0, 5),
    nextSteps: d.nextSteps.slice(0, 4),
    aiGenerated: result.source === 'ai',
  };
}

function proposalTemplate(i: ComposeProposalInput): ComposeProposalOutput {
  const p = i.best;
  const beds = p.bedrooms === 0 ? 'studio' : `${p.bedrooms}-bedroom ${p.type.toLowerCase()}`;
  const price = `${formatAed(p.priceAed)}${p.listingType === 'RENT' ? '/year' : ''}`;
  const why = [
    p.reason ?? `It matches the ${beds} you asked for in ${p.community}.`,
    `${p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bedrooms`}, ${p.bathrooms} bathrooms and ${p.areaSqft.toLocaleString()} sqft.`,
    p.completionStatus === 'READY' ? 'Ready to move in.' : 'Off-plan, with a developer payment plan.',
    ...(p.view ? [`${p.view} view.`] : []),
  ];
  return {
    headline: `${p.title}, ${p.community}`,
    intro: `Hi ${i.lead.firstName}, thank you for your enquiry. Based on what you told us, this ${beds} in ${p.community} at ${price} is the closest fit in our current listings.`,
    whyItFits: why.slice(0, 5),
    nextSteps: [
      'Visit the property at one of the times below.',
      p.listingType === 'RENT' ? 'Agree the rent, cheques and move-in date.' : 'Agree the price and payment terms.',
      p.listingType === 'RENT' ? 'Sign the tenancy contract and register Ejari.' : 'Sign the booking form and pay the reservation deposit.',
    ],
    emailSubject: `Your property proposal: ${p.title}`.slice(0, 70),
    emailBody: [
      `Hi ${i.lead.firstName},`,
      `Thank you for your enquiry. I have attached a proposal for ${p.title} in ${p.community} (${price}), which is the best match for what you are looking for. Other options we found are listed in the PDF too.`,
      `I can arrange a site visit at any of these times (Dubai time):\n${i.slots.map((s, n) => `Option ${n + 1}: ${s}`).join('\n')}`,
      'Just reply with the option that suits you, for example "Option 1 works", or suggest another time.',
      `${i.agentName}, LeadsTrellis`,
    ].join('\n\n'),
  };
}
