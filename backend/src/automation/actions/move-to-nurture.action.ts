import { createTask } from '../../modules/tasks/task.service.js';
import { advanceIfIn } from '../../modules/pipeline/pipeline.service.js';
import { addDays } from '../../utils/dates.js';

const NURTURE_EVERY_DAYS = 30;

/** Not interested → nurture with a monthly market update (or Lost if they opted out). */
export async function moveToNurture(leadId: string, optOut: boolean) {
  if (optOut) {
    await advanceIfIn(leadId, ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION', 'NURTURE'], 'CLOSED_LOST', 'AI', 'Asked not to be contacted');
    return 'Opted out: closed as lost, no further contact';
  }
  await advanceIfIn(leadId, ['NEW', 'QUALIFIED', 'CONTACTED', 'ENGAGED', 'VIEWING', 'NEGOTIATION'], 'NURTURE', 'AI', 'Not interested right now');
  await createTask(leadId, 'NURTURE', addDays(new Date(), NURTURE_EVERY_DAYS), 'Monthly market update');
  return `Moved to nurture; next update in ${NURTURE_EVERY_DAYS} days`;
}

export const nextNurtureDate = () => addDays(new Date(), NURTURE_EVERY_DAYS);
