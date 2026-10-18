
interface Lead {
  id: string;
  fullName: string;
  number: number;
}

interface PropertyCard {
  refCode: string;
  title: string;
  community: string;
  emirate: string;
  priceAed: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  imageUrls: string[];
  reason?: string;
}

const CREAM = '#F6F1E6';
const DEEP_GREEN = '#2E5248';
const AED = (n: number) => `AED ${n.toLocaleString()}`;
const firstName = (name: string) => name.split(' ')[0] ?? name;

/** One-click answer links for the lead (see modules/responses). */
export interface ResponseLinks {
  interested: string;
  later: string;
  notInterested: string;
  unsubscribe: string;
  /** mailto: our reply address, so a question lands in the Inbox. */
  question?: string;
}

/**
 * Quick-answer block under the email body. "full" offers interested / later / not
 * interested; "minimal" (confirmations, reminders) only the question link. Both end with
 * an unsubscribe link.
 */
function responseBlock(links: ResponseLinks, variant: 'full' | 'minimal') {
  const pill = (label: string, href: string, primary = false) =>
    `<a href="${href}" style="display:inline-block;margin:4px;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;${
      primary ? `background:${DEEP_GREEN};color:#fff` : `background:#fff;color:${DEEP_GREEN};border:1px solid ${DEEP_GREEN}`
    }">${label}</a>`;
  const buttons =
    variant === 'full'
      ? `<p style="margin:0 0 8px;font-size:14px;color:#4F5F58">Let us know with one click:</p>
         <div>${pill('I&#39;m interested', links.interested, true)}${pill('Contact me later', links.later)}${pill('Not interested', links.notInterested)}</div>`
      : '';
  const question = links.question
    ? `<p style="margin:${variant === 'full' ? '12px' : '0'} 0 0;font-size:14px;color:#4F5F58">Have a question? <a href="${links.question}" style="color:${DEEP_GREEN}">Ask us</a> or simply reply to this email.</p>`
    : '';
  return `<div style="margin:24px 0 0;padding:18px 16px;border-top:1px solid #EFE7D5;text-align:center">${buttons}${question}</div>`;
}

/**
 * Shared email shell — cream background, deep-green brand bar, large readable body text.
 * Email clients only honour inline CSS, so every colour and spacing is set as a style attribute.
 */
function shell(contentHtml: string, links?: ResponseLinks, variant: 'full' | 'minimal' = 'full') {
  const unsub = links
    ? `<p style="margin:24px 0 0;font-size:12px;color:#67786F;text-align:center">
         <a href="${links.unsubscribe}" style="color:#67786F;text-decoration:underline">Unsubscribe</a>
       </p>`
    : '';
  return `<!doctype html>
<html>
<body style="margin:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E2A26">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <div style="background:${DEEP_GREEN};color:#fff;padding:18px 24px;border-radius:14px 14px 0 0;font-weight:600;letter-spacing:0.5px">
      LeadsTrellis
    </div>
    <div style="background:#FFFFFF;padding:28px 24px;border-radius:0 0 14px 14px;line-height:1.6;font-size:16px">
      ${contentHtml}
      ${links ? responseBlock(links, variant) : ''}
    </div>
    ${unsub}
  </div>
</body>
</html>`;
}

function propertyCardHtml(p: PropertyCard) {
  const img = p.imageUrls[0] ?? '';
  return `<div style="margin:12px 0;border:1px solid #EFE7D5;border-radius:12px;overflow:hidden">
    ${img ? `<img src="${img}" alt="${escapeHtml(p.title)}" style="display:block;width:100%;max-height:260px;object-fit:cover">` : ''}
    <div style="padding:16px">
      <p style="margin:0;font-size:18px;font-weight:600;color:#1E2A26">${escapeHtml(p.title)}</p>
      <p style="margin:4px 0 10px;font-size:14px;color:#4F5F58">${escapeHtml(p.community)}, ${escapeHtml(p.emirate)} · ${p.bedrooms}BR · ${p.bathrooms}BA · ${p.areaSqft.toLocaleString()} sqft</p>
      <p style="margin:0;font-size:18px;color:${DEEP_GREEN};font-weight:600">${AED(p.priceAed)}</p>
      ${p.reason ? `<p style="margin:10px 0 0;font-size:14px;color:#4F5F58"><em>Why it fits:</em> ${escapeHtml(p.reason)}</p>` : ''}
    </div>
  </div>`;
}

function ctaButton(label: string, href: string) {
  return `<p style="margin:24px 0;text-align:center">
    <a href="${href}" style="display:inline-block;background:${DEEP_GREEN};color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a>
  </p>`;
}

/** Recommendation email: 1–3 property cards + "Book a viewing" CTA. */
export function recommendationEmail(lead: Lead, properties: PropertyCard[], links?: ResponseLinks) {
  const subject = properties.length
    ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} that match your search`
    : 'A quick note from EstatePilot';
  const cards = properties.map(propertyCardHtml).join('');
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName(lead.fullName))},</p>
     <p style="margin:0 0 20px">Based on what you told us, here ${properties.length === 1 ? 'is a property' : 'are a few properties'} that look like a strong fit:</p>
     ${cards}
     <p style="margin:24px 0 0">Reply to this email with any questions and I'll come back to you.</p>
     <p style="margin:16px 0 0">— LeadsTrellis</p>`,
    links,
  );
  return { subject, html };
}

/** Follow-up (no reply) email: short, specific nudge with one new angle. */
export function followUpEmail(lead: Lead, angle: string, links?: ResponseLinks) {
  const subject = 'Still interested? One quick thought';
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName(lead.fullName))},</p>
     <p style="margin:0 0 16px">${escapeHtml(angle)}</p>
     <p style="margin:0">If you'd rather we hold off, just reply "pause" and we will.</p>
     <p style="margin:16px 0 0">— LeadsTrellis</p>`,
    links,
  );
  return { subject, html };
}

/** Proposal email sent after a positive viewing — the shortlisted unit + next steps. */
export function proposalEmail(lead: Lead, property: PropertyCard, links?: ResponseLinks) {
  const subject = `Proposal: ${property.title}`;
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName(lead.fullName))},</p>
     <p style="margin:0 0 20px">Great to hear the viewing went well. Here is the proposal for the unit we discussed:</p>
     ${propertyCardHtml(property)}
     <p style="margin:16px 0 0">Next steps if you'd like to go ahead:</p>
     <ul style="margin:8px 0 0;padding-left:20px">
       <li>Confirm the price above and the handover date (if off-plan).</li>
       <li>Share a copy of your ID and proof of funds or mortgage pre-approval.</li>
       <li>Sign the booking form; a 10% reservation deposit holds the unit for you.</li>
     </ul>
     <p style="margin:20px 0 0">Reply "yes, let's go ahead" and I'll send the booking form today.</p>
     <p style="margin:16px 0 0">— LeadsTrellis</p>`,
    links,
  );
  return { subject, html };
}

export function viewingReminderEmail(lead: Lead, when: string, propertyTitle: string, links?: ResponseLinks) {
  const subject = `Reminder: your viewing ${when}`;
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName(lead.fullName))},</p>
     <p style="margin:0 0 16px">A quick reminder of your viewing <strong>${escapeHtml(when)}</strong> at <strong>${escapeHtml(propertyTitle)}</strong>.</p>
     <p style="margin:0">If anything's changed, reply here and we'll move it.</p>
     <p style="margin:16px 0 0">— LeadsTrellis</p>`,
    links,
    'minimal',
  );
  return { subject, html };
}

/** Plain AI-written text → HTML paragraphs (line breaks kept inside a paragraph). */
function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Covering email for the AI proposal: the written body, the main property card and two buttons (the PDF is attached). */
export function proposalCoverEmail(body: string, property: PropertyCard, links: { proposalUrl: string; pdfUrl: string }, respond?: ResponseLinks) {
  return shell(
    `${paragraphs(body)}
     ${propertyCardHtml(property)}
     <p style="margin:24px 0 8px;text-align:center">
       <a href="${links.proposalUrl}" style="display:inline-block;background:${DEEP_GREEN};color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">View proposal &amp; confirm a visit</a>
     </p>
     <p style="margin:0 0 8px;text-align:center;font-size:14px">
       <a href="${links.pdfUrl}" style="color:${DEEP_GREEN}">Download the PDF</a> · the PDF is also attached to this email
     </p>`,
    respond,
  );
}

/** A plain reply in the thread (answers to questions, asking for a time, polite close). */
export function replyEmail(body: string, links?: ResponseLinks) {
  return shell(paragraphs(body), links);
}

/** Site visit confirmed: when, where (full address + map), who meets them. */
export function visitConfirmedEmail(
  lead: Lead,
  v: { when: string; propertyTitle: string; address: string; mapsUrl: string; agentName: string | null; agentPhone: string | null },
  links?: ResponseLinks,
) {
  const subject = `Site visit confirmed: ${v.propertyTitle}, ${v.when}`;
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName(lead.fullName))},</p>
     <p style="margin:0 0 16px">Thank you for confirming. Your site visit is booked:</p>
     <div style="background:${CREAM};border-radius:12px;padding:16px 18px;margin:0 0 16px">
       <p style="margin:0 0 6px"><strong>Property:</strong> ${escapeHtml(v.propertyTitle)}</p>
       <p style="margin:0 0 6px"><strong>When:</strong> ${escapeHtml(v.when)} (Dubai time)</p>
       <p style="margin:0 0 6px"><strong>Address:</strong> ${escapeHtml(v.address)}</p>
       ${v.agentName ? `<p style="margin:0"><strong>Meeting you:</strong> ${escapeHtml(v.agentName)}${v.agentPhone ? `, ${escapeHtml(v.agentPhone)}` : ''}</p>` : ''}
     </div>
     ${ctaButton('Open in Google Maps', v.mapsUrl)}
     <p style="margin:0">A calendar invite is attached. If you need to change the time, just reply to this email.</p>
     <p style="margin:16px 0 0">— LeadsTrellis</p>`,
    links,
    'minimal',
  );
  return { subject, html };
}

/** Agent invitation email with one-click setup link. */
export function agentInviteEmail(input: { name: string; email: string; setupUrl: string }) {
  const subject = 'You have been invited to join LeadsTrellis';
  const html = shell(
    `<p style="margin:0 0 12px">Hi ${escapeHtml(input.name)},</p>
     <p style="margin:0 0 16px">You have been invited to join the LeadsTrellis real-estate CRM as an agent.</p>
     <p style="margin:0 0 20px">Click the button below to set up your password and access your assigned leads:</p>
     ${ctaButton('Activate Account & Set Password', input.setupUrl)}
     <p style="margin:16px 0 0;font-size:13px;color:#718096">Or copy and paste this link in your browser:<br><a href="${input.setupUrl}" style="color:#000">${input.setupUrl}</a></p>
     <p style="margin:20px 0 0;font-size:13px;color:#718096">This invitation link will expire in 7 days.</p>
     <p style="margin:16px 0 0">— LeadsTrellis Team</p>`,
    undefined,
    'minimal',
  );
  return { subject, html };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
