import { ImapFlow } from 'imapflow';
import { simpleParser, type AddressObject } from 'mailparser';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { recordInbound } from '../../modules/communications/communications.service.js';

/**
 * Reads lead replies from the mailbox over IMAP. Read-only: it never changes flags or
 * moves mail, so the inbox looks the same in Gmail. Each reply is matched to its lead by
 * (1) the plus-address in Reply-To (you+L1042@…), (2) the thread headers, or (3) the
 * sender's address, then stored and handed to the Inbox agent.
 *
 * Delivery: one long-lived connection sits in IMAP IDLE, so the server pushes new mail
 * within seconds and we log in once instead of every poll. pollInbox() stays as a backup
 * and only opens its own connection while the IDLE watcher is down.
 */
const imapConfig = () => {
  const host = env.IMAP_HOST ?? (env.SMTP_HOST === 'smtp.gmail.com' ? 'imap.gmail.com' : env.SMTP_HOST?.replace(/^smtp\./, 'imap.'));
  const user = env.IMAP_USER ?? env.SMTP_USER;
  const pass = env.IMAP_PASS ?? env.SMTP_PASS;
  return host && user && pass ? { host, user, pass } : null;
};

export const imapReady = () => Boolean(imapConfig());

let lastUid: number | null = null;
let syncing = false;

const newClient = (cfg: NonNullable<ReturnType<typeof imapConfig>>) =>
  new ImapFlow({
    host: cfg.host,
    port: env.IMAP_PORT,
    secure: env.IMAP_PORT === 993,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    // Gmail drops an IDLE after ~29 minutes; re-issue it well before that.
    maxIdleTime: 5 * 60_000,
  });

/** Reads every message newer than lastUid on a client that already has INBOX selected. One run at a time. */
async function syncNew(client: ImapFlow, mailbox: string) {
  if (syncing) return;
  syncing = true;
  try {
    // First run after boot: look back two days; afterwards only newer UIDs.
    const range = lastUid ? { uid: `${lastUid + 1}:*` } : { since: new Date(Date.now() - 2 * 86_400_000) };
    const uids = ((await client.search(range, { uid: true })) || []).filter((u) => !lastUid || u > lastUid);
    for (const uid of uids) {
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (msg && msg.source) await handleRaw(msg.source, mailbox);
      lastUid = Math.max(lastUid ?? 0, uid);
    }
    if (!uids.length && lastUid === null) lastUid = (client.mailbox && typeof client.mailbox === 'object' ? client.mailbox.uidNext - 1 : 0) || 0;
  } finally {
    syncing = false;
  }
}

let watcher: ImapFlow | null = null;
let watcherUp = false;
let stopped = false;
let retryMs = 5_000;
let retryTimer: NodeJS.Timeout | undefined;

/** Opens the long-lived IDLE connection and reconnects (with backoff up to 5 min) whenever it drops. */
export async function startInboxWatcher() {
  const cfg = imapConfig();
  if (!cfg || watcher) return;
  stopped = false;
  const client = newClient(cfg);
  watcher = client;
  const reconnect = () => {
    watcherUp = false;
    if (watcher === client) watcher = null;
    if (stopped) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => void startInboxWatcher(), retryMs);
    retryMs = Math.min(retryMs * 2, 5 * 60_000);
  };
  client.on('close', reconnect);
  client.on('error', (err: Error) => logger.warn({ err: err.message }, 'imap watcher error'));
  client.on('exists', () => void syncNew(client, cfg.user).catch((err) => logger.warn({ err: err instanceof Error ? err.message : err }, 'imap sync failed')));
  try {
    await client.connect();
    // Selecting the mailbox and leaving the client idle makes imapflow sit in IDLE.
    await client.mailboxOpen('INBOX', { readOnly: true });
    watcherUp = true;
    retryMs = 5_000;
    logger.info('imap watcher connected (IDLE)');
    await syncNew(client, cfg.user);
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, 'imap watcher connect failed');
    try {
      client.close();
    } catch {
      /* already closed */
    }
    // 'close' may not fire for a connection that never opened.
    if (watcher === client) reconnect();
  }
}

export async function stopInboxWatcher() {
  stopped = true;
  clearTimeout(retryTimer);
  const client = watcher;
  watcher = null;
  watcherUp = false;
  await client?.logout().catch(() => undefined);
}

/** Backup check: does nothing while the IDLE watcher is connected, else one short connection. */
export async function pollInbox() {
  const cfg = imapConfig();
  if (!cfg || watcherUp || syncing) return;
  const client = newClient(cfg);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX', { readOnly: true });
    try {
      await syncNew(client, cfg.user);
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : err }, 'imap poll failed');
    try {
      client.close();
    } catch {
      /* already closed */
    }
  }
}

async function handleRaw(source: Buffer, mailbox: string) {
  const mail = await simpleParser(source);
  const messageId = mail.messageId ?? undefined;
  const from = firstAddress(mail.from)?.toLowerCase();
  if (!from) return;
  const recipients = [...addresses(mail.to), ...addresses(mail.cc), ...headerList(mail.headers.get('delivered-to'))];
  // Mail from our own address is our own outbound copy, unless it was sent to a lead's
  // +L tag (someone testing with their own mailbox as the lead).
  if (from === mailbox.toLowerCase() && !recipients.some((r) => /\+l\d+@/i.test(r))) return;
  if (messageId && (await prisma.message.findFirst({ where: { providerMessageId: messageId }, select: { id: true } }))) return;

  const leadId = await findLead({
    recipients,
    threadIds: [mail.inReplyTo, ...(Array.isArray(mail.references) ? mail.references : mail.references ? [mail.references] : [])].filter(Boolean) as string[],
    from,
  });
  if (!leadId) return;

  const body = stripQuoted(mail.text ?? '');
  if (!body) return;
  await recordInbound(leadId, 'EMAIL', body, messageId);
  logger.info({ leadId, from }, 'email reply received');
}

async function findLead(m: { recipients: string[]; threadIds: string[]; from: string }) {
  for (const r of m.recipients) {
    const n = r.match(/\+l(\d+)@/i)?.[1];
    if (n) {
      const lead = await prisma.lead.findUnique({ where: { number: Number(n) }, select: { id: true } });
      if (lead) return lead.id;
    }
  }
  if (m.threadIds.length) {
    const out = await prisma.message.findFirst({ where: { providerMessageId: { in: m.threadIds }, direction: 'OUT' }, select: { leadId: true } });
    if (out) return out.leadId;
    const proposal = await prisma.proposal.findFirst({ where: { emailMessageId: { in: m.threadIds } }, select: { leadId: true } });
    if (proposal) return proposal.leadId;
  }
  // Fall back to the sender, preferring a lead the AI route is working on.
  const lead = await prisma.lead.findFirst({
    where: { email: { equals: m.from, mode: 'insensitive' } },
    orderBy: [{ aiRouteEnabled: 'desc' }, { lastContactedAt: { sort: 'desc', nulls: 'last' } }],
    select: { id: true, lastContactedAt: true },
  });
  // Only count it as a reply if we have actually emailed this lead.
  return lead?.lastContactedAt ? lead.id : null;
}

/** Keeps only what the lead wrote, dropping the quoted thread and signatures below it. */
export function stripQuoted(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if (/^On .+wrote:\s*$/i.test(line.trim()) || /^-{2,}\s*Original Message/i.test(line) || /^From: .+/i.test(line.trim()) || /^>/.test(line)) break;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000);
}

const firstAddress = (a?: AddressObject | AddressObject[]) => addresses(a)[0];
function addresses(a?: AddressObject | AddressObject[]): string[] {
  if (!a) return [];
  return (Array.isArray(a) ? a : [a]).flatMap((x) => x.value.map((v) => v.address ?? '')).filter(Boolean);
}
function headerList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'object' && v && 'text' in v) return [String((v as { text: string }).text)];
  return [String(v)];
}
