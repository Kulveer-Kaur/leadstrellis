import PDFDocument from 'pdfkit';
import { logger } from '../../lib/logger.js';
import { formatDubai } from '../../utils/dates.js';

export interface ProposalPdfProperty {
  refCode: string;
  title: string;
  description: string;
  type: string;
  listingType: string;
  priceAed: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  building: string | null;
  community: string;
  emirate: string;
  lat: number;
  lng: number;
  developer: string | null;
  completionStatus: string;
  handoverDate: Date | null;
  furnished: boolean;
  view: string | null;
  amenities: string[];
  imageUrls: string[];
}

export interface ProposalAlternative {
  propertyId: string;
  refCode: string;
  title: string;
  community: string;
  priceAed: number;
  bedrooms: number;
  fitScore: number | null;
  reason: string | null;
}

export interface ProposalPdfInput {
  number: string;
  createdAt: Date;
  leadName: string;
  agent: { name: string; email: string; phone: string | null } | null;
  fitScore: number | null;
  headline: string;
  intro: string;
  whyItFits: string[];
  nextSteps: string[];
  slots: Date[];
  property: ProposalPdfProperty;
  alternatives: ProposalAlternative[];
  proposalUrl: string;
}

const GREEN = '#2E5248';
const CREAM = '#F6F1E6';
const INK = '#1E2A26';
const MUTED = '#5B6A63';
const LINE = '#E6DDCB';
const MARGIN = 48;

const aed = (n: number) => `AED ${n.toLocaleString('en-US')}`;
export const propertyAddress = (p: Pick<ProposalPdfProperty, 'building' | 'community' | 'emirate'>) =>
  [p.building, p.community, p.emirate, 'United Arab Emirates'].filter(Boolean).join(', ');
export const mapsUrl = (p: Pick<ProposalPdfProperty, 'lat' | 'lng'>) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

/** Renders the branded proposal PDF (A4) and resolves with its bytes. */
export async function renderProposalPdf(raw: ProposalPdfInput): Promise<Buffer> {
  const input = pdfSafe(raw);
  const photo = await fetchImage(input.property.imageUrls[0]);
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: `Proposal ${input.number}: ${input.property.title}`, Author: 'LeadsTrellis' } });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const width = doc.page.width - MARGIN * 2;
  const p = input.property;

  // Brand bar
  doc.rect(0, 0, doc.page.width, 84).fill(GREEN);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('LeadsTrellis', MARGIN, 28);
  doc.font('Helvetica').fontSize(10).text(`Property proposal ${input.number}`, MARGIN, 34, { width, align: 'right' });
  doc.text(input.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' }), MARGIN, 50, { width, align: 'right' });

  doc.y = 108;
  doc.fillColor(MUTED).fontSize(10).text(`Prepared for ${input.leadName}`);
  doc.moveDown(0.3);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(input.headline, { width });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(11).fillColor(INK).text(input.intro, { width, lineGap: 2 });
  doc.moveDown(0.8);

  if (photo) {
    const h = 210;
    ensureSpace(doc, h + 10);
    const y = doc.y;
    try {
      // `cover` scales past the box, so clip to it (rounded corners) before drawing.
      doc.save();
      doc.roundedRect(MARGIN, y, width, h, 10).clip();
      doc.image(photo, MARGIN, y, { cover: [width, h], align: 'center', valign: 'center' });
      doc.restore();
      doc.y = y + h + 14;
    } catch (err) {
      doc.restore();
      doc.y = y;
      logger.debug({ err }, 'proposal pdf: image embed failed');
    }
  }

  // Property title + price + match score
  ensureSpace(doc, 70);
  const top = doc.y;
  doc.font('Helvetica-Bold').fontSize(15).fillColor(INK).text(p.title, MARGIN, top, { width: width - 150 });
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(`Ref ${p.refCode}`, { width: width - 150 });
  doc.font('Helvetica-Bold').fontSize(15).fillColor(GREEN).text(`${aed(p.priceAed)}${p.listingType === 'RENT' ? ' / year' : ''}`, MARGIN, top, { width, align: 'right' });
  if (input.fitScore != null) doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(`${input.fitScore}% match to your brief`, MARGIN, top + 20, { width, align: 'right' });
  doc.y = Math.max(doc.y, top + 40);

  // Address box
  doc.moveDown(0.4);
  const boxY = doc.y;
  doc.roundedRect(MARGIN, boxY, width, 52, 8).fill(CREAM);
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('ADDRESS FOR THE SITE VISIT', MARGIN + 14, boxY + 10);
  doc.fillColor(INK).font('Helvetica').fontSize(11).text(propertyAddress(p), MARGIN + 14, boxY + 23, { width: width - 28 });
  doc.fillColor(GREEN).fontSize(9).text('Open in Google Maps', MARGIN + 14, boxY + 38, { link: mapsUrl(p), underline: true });
  doc.y = boxY + 64;

  // Key facts
  section(doc, 'Key facts');
  const facts: [string, string][] = [
    ['Type', `${cap(p.type)} for ${p.listingType === 'RENT' ? 'rent' : 'sale'}`],
    ['Bedrooms', p.bedrooms === 0 ? 'Studio' : String(p.bedrooms)],
    ['Bathrooms', String(p.bathrooms)],
    ['Size', `${p.areaSqft.toLocaleString('en-US')} sqft`],
    ['Status', p.completionStatus === 'READY' ? 'Ready to move in' : `Off-plan${p.handoverDate ? `, handover ${p.handoverDate.toISOString().slice(0, 7)}` : ''}`],
    ['Furnished', p.furnished ? 'Yes' : 'No'],
    ...(p.view ? [['View', p.view] as [string, string]] : []),
    ...(p.developer ? [['Developer', p.developer] as [string, string]] : []),
  ];
  const colW = width / 2;
  facts.forEach(([k, v], i) => {
    const x = MARGIN + (i % 2) * colW;
    if (i % 2 === 0) ensureSpace(doc, 20);
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(k, x, y, { width: 80 });
    doc.fillColor(INK).text(v, x + 80, y, { width: colW - 90 });
    if (i % 2 === 1 || i === facts.length - 1) doc.y = y + 18;
    else doc.y = y;
  });
  if (p.amenities.length) {
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Amenities  ', MARGIN, doc.y, { continued: true }).fillColor(INK).text(p.amenities.slice(0, 10).join(' · '), { width });
  }

  section(doc, 'Why it fits what you asked for');
  bullets(doc, input.whyItFits, width);

  section(doc, 'Book your site visit');
  doc.font('Helvetica').fontSize(11).fillColor(INK).text('Reply to our email with the option that suits you, or confirm online:', { width });
  doc.moveDown(0.3);
  input.slots.forEach((s, i) => {
    ensureSpace(doc, 18);
    doc.font('Helvetica-Bold').fillColor(GREEN).text(`Option ${i + 1}  `, { continued: true }).font('Helvetica').fillColor(INK).text(`${formatDubai(s)} (Dubai time)`);
  });
  doc.moveDown(0.3);
  doc.fillColor(GREEN).fontSize(10).text('Confirm a time online', { link: input.proposalUrl, underline: true });

  if (input.alternatives.length) {
    section(doc, 'Other options we matched for you');
    for (const a of input.alternatives) {
      ensureSpace(doc, 40);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(a.title, MARGIN, y, { width: width - 140 });
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(`${a.community} · ${a.bedrooms === 0 ? 'Studio' : `${a.bedrooms} BR`} · Ref ${a.refCode}`, { width: width - 140 });
      if (a.reason) doc.fillColor(INK).text(a.reason, { width: width - 140 });
      const endY = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GREEN).text(aed(a.priceAed), MARGIN, y, { width, align: 'right' });
      if (a.fitScore != null) doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`${a.fitScore}% match`, MARGIN, y + 15, { width, align: 'right' });
      doc.y = Math.max(endY, y + 30) + 8;
    }
  }

  section(doc, 'Next steps');
  bullets(doc, input.nextSteps.map((s, i) => `${i + 1}. ${s}`), width, false);

  if (input.agent) {
    section(doc, 'Your agent');
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(input.agent.name);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text([input.agent.phone, input.agent.email].filter(Boolean).join(' · '));
  }

  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Prices and availability are taken from the listing on the date above and remain subject to confirmation by the owner or developer.', { width });

  doc.end();
  return done;
}

function section(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 60);
  doc.moveDown(0.9);
  const y = doc.y;
  doc.moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.y = y + 10;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(title, MARGIN);
  doc.moveDown(0.4);
}

function bullets(doc: PDFKit.PDFDocument, items: string[], width: number, dot = true) {
  doc.font('Helvetica').fontSize(11).fillColor(INK);
  for (const item of items) {
    ensureSpace(doc, 20);
    doc.text(dot ? `•  ${item}` : item, MARGIN, doc.y, { width, lineGap: 2 });
    doc.moveDown(0.25);
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - MARGIN) doc.addPage();
}

/**
 * The built-in PDF fonts only cover Latin-1/WinAnsi. The AI likes typographic Unicode
 * (non-breaking hyphens, narrow spaces), which would print as junk, so map it to plain
 * equivalents and drop anything else the font cannot draw.
 */
export function pdfText(s: string) {
  return s
    .normalize('NFKC')
    .replace(/[\u2010\u2011\u2012\u2043]/g, '-')
    .replace(/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u20ac]/g, '');
}

function pdfSafe<T>(v: T): T {
  if (typeof v === 'string') return pdfText(v) as T;
  if (Array.isArray(v)) return v.map(pdfSafe) as T;
  if (v && typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'imageUrls' || k.endsWith('Url') ? x : pdfSafe(x)])) as T;
  }
  return v;
}

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Downloads the cover photo (JPEG/PNG only, 6s timeout). A missing photo never blocks the proposal. */
async function fetchImage(url?: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Image CDNs may answer with WebP, which the PDF cannot embed: ask for JPEG.
    if (u.hostname.includes('unsplash.com') || u.hostname.includes('pexels.com')) u.searchParams.set('fm', 'jpg');
    const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    logger.debug({ err, url }, 'proposal pdf: could not fetch photo');
    return null;
  }
}
