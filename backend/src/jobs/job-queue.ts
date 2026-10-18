import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

interface Job {
  key: string;
  name: string;
  run: () => Promise<void>;
  attempt: number;
}

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Small in-process job queue: one job at a time (keeps Groq free-tier usage under its
 * per-minute limits), de-duplicated by key, retried with backoff. Job state that must
 * survive restarts lives in Postgres (e.g. Lead.processingState) and is re-enqueued on boot.
 */
class JobQueue {
  private queue: Job[] = [];
  private queued = new Set<string>();
  private running = false;

  enqueue(name: string, key: string, run: () => Promise<void>) {
    if (this.queued.has(key)) return false;
    this.queued.add(key);
    this.queue.push({ key, name, run, attempt: 1 });
    void this.drain();
    return true;
  }

  get size() {
    return this.queue.length;
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const job = this.queue.shift()!;
      try {
        await job.run();
        this.queued.delete(job.key);
      } catch (err) {
        if (job.attempt < MAX_ATTEMPTS) {
          logger.warn({ err, job: job.name, key: job.key, attempt: job.attempt }, 'job failed, retrying');
          const retry = { ...job, attempt: job.attempt + 1 };
          setTimeout(() => {
            this.queue.push(retry);
            void this.drain();
          }, 2000 * 2 ** job.attempt);
        } else {
          logger.error({ err, job: job.name, key: job.key }, 'job failed permanently');
          this.queued.delete(job.key);
        }
      }
      if (env.JOB_SPACING_MS) await sleep(env.JOB_SPACING_MS);
    }
    this.running = false;
  }
}

export const jobQueue = new JobQueue();
