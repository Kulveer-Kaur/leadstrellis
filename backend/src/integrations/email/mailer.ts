import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
  /** Message-ID of the email this one answers, so it lands in the same thread. */
  inReplyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: 'smtp' | 'log';
  messageId?: string;
  error?: string;
}

let transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Gmail: 587 = STARTTLS (secure=false), 465 = SMTPS (secure=true).
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export const mailerReady = () => Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

/**
 * Reply-To with plus-addressing (you+L1042@gmail.com) so the IMAP reader can tie a reply
 * to its lead even when the lead answers from a different address.
 */
export function replyAddressFor(leadNumber: number) {
  const user = env.SMTP_USER;
  if (!user?.includes('@')) return undefined;
  const [local, domain] = user.split('@');
  return `${local}+L${leadNumber}@${domain}`;
}

/** Browser-reachable API base used in email links. */
export const publicApiUrl = () => env.PUBLIC_API_URL ?? `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/api/v1`;

/**
 * Send one email. With SMTP configured, uses nodemailer; otherwise logs the subject + a
 * snippet so a developer can see what would have gone out. Never throws — callers decide
 * whether to retry based on the returned { sent } flag.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const t = getTransporter();
  const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'LeadsTrellis <noreply@leadstrellis.com>';
  if (!t) {
    logger.info({ to: input.to, subject: input.subject, snippet: snippet(input.html) }, 'mailer: SMTP not configured — logged instead');
    return { sent: false, provider: 'log' };
  }
  try {
    const info = await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
      replyTo: input.replyTo,
      headers: input.headers,
      attachments: input.attachments,
      ...(input.inReplyTo ? { inReplyTo: input.inReplyTo, references: [input.inReplyTo] } : {}),
    });
    logger.info({ to: input.to, subject: input.subject, messageId: info.messageId }, 'email sent');
    return { sent: true, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, to: input.to, subject: input.subject }, 'email send failed');
    return { sent: false, provider: 'smtp', error: message };
  }
}

const snippet = (html: string) => stripHtml(html).replace(/\s+/g, ' ').slice(0, 160);
const stripHtml = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim();
