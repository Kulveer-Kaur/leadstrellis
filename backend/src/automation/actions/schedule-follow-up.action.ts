import { createTask } from '../../modules/tasks/task.service.js';
import { addDays } from '../../utils/dates.js';
import { sendOutreach } from './send-outreach.action.js';

/** "Not ready": schedule the follow-up for when they said, and send a soft recap now. */
export async function scheduleFollowUp(leadId: string, inDays: number | null, note?: string) {
  const days = inDays ?? 14;
  await createTask(leadId, 'FOLLOW_UP', addDays(new Date(), days), note);
  await sendOutreach(leadId, 'POST_CALL', undefined, `They are not ready yet; we agreed to check in again in ${days} days.`);
  return `Follow-up in ${days} days`;
}
