import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BellOff, CalendarClock, Check, Heart, ThumbsDown, type LucideIcon } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button, Card, CardSkeleton } from '@/components/ui';
import { http } from '@/services/http';
import { cn } from '@/utils/cn';

type Choice = 'interested' | 'later' | 'not-interested' | 'unsubscribe';

interface ResponsePage {
  firstName: string;
  agentName: string | null;
  unsubscribed: boolean;
  won: boolean;
  recorded?: boolean;
}

const CHOICES: { value: Choice; label: string; help: string; icon: LucideIcon }[] = [
  { value: 'interested', label: 'I’m interested', help: 'Your agent will call you back shortly.', icon: Heart },
  { value: 'later', label: 'Contact me later', help: 'We’ll pause and get back in touch when it suits you.', icon: CalendarClock },
  { value: 'not-interested', label: 'Not interested', help: 'No problem. We’ll only send the occasional market update.', icon: ThumbsDown },
  { value: 'unsubscribe', label: 'Unsubscribe', help: 'Stop all emails from us.', icon: BellOff },
];

const MONTHS = [1, 3, 6] as const;

const DONE: Record<Choice, (p: ResponsePage, months: number) => string> = {
  interested: (p) => `Thank you! ${p.agentName ?? 'Your agent'} will be in touch shortly.`,
  later: (_p, m) => `Got it. We’ll get back in touch in about ${m} month${m > 1 ? 's' : ''}.`,
  'not-interested': () => 'Thanks for letting us know. We won’t send more property suggestions.',
  unsubscribe: () => 'You’re unsubscribed. You won’t receive any more emails from us.',
};

const isChoice = (v: string | null): v is Choice => CHOICES.some((c) => c.value === v);

/**
 * Public page behind the one-click buttons in our emails. Opening it only reads: the lead
 * confirms here, so link scanners in email apps can never record a choice by themselves.
 */
export default function RespondPage() {
  const { token = '' } = useParams();
  const [params] = useSearchParams();
  const initial = params.get('choice');
  const [choice, setChoice] = useState<Choice | null>(isChoice(initial) ? initial : null);
  const [months, setMonths] = useState<number>(1);
  const { data, isLoading, isError } = useQuery({ queryKey: ['public-respond', token], queryFn: () => http.get<ResponsePage>(`/public/respond/${token}`), retry: false });
  const save = useMutation({ mutationFn: (c: Choice) => http.post<ResponsePage>(`/public/respond/${token}`, { choice: c, ...(c === 'later' ? { months } : {}) }) });

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-xl items-center">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        {isLoading && <CardSkeleton className="h-96" />}
        {isError && (
          <Card>
            <h1 className="text-title-large text-heading">Link not found</h1>
            <p className="mt-2 text-body-medium text-muted">Please use the button in your email, or simply reply to it and we will help.</p>
          </Card>
        )}

        {data && save.isSuccess && choice && (
          <Card className="text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-6" aria-hidden />
            </span>
            <h1 className="text-title-large text-heading">{DONE[choice](data, months)}</h1>
            <p className="mt-2 text-body-medium text-muted">You can close this page. Questions? Just reply to any of our emails.</p>
          </Card>
        )}

        {data && !save.isSuccess && (
          <Card>
            <h1 className="text-title-large text-heading sm:text-headline-small">Hi {data.firstName}, how would you like us to proceed?</h1>
            <p className="mt-1 text-body-medium text-muted">
              {data.unsubscribed ? 'You’re currently unsubscribed. Choose an option below to hear from us again.' : 'Pick one and confirm. It only takes a second.'}
            </p>

            <div role="radiogroup" aria-label="Your answer" className="mt-5 flex flex-col gap-2">
              {CHOICES.map((c) => {
                const selected = choice === c.value;
                return (
                  <div key={c.value} className={cn('rounded-panel border transition-colors', selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface')}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setChoice(c.value)}
                      className="flex min-h-12 w-full cursor-pointer items-start gap-3 rounded-panel px-4 py-3 text-left hover:bg-surface-2/60"
                    >
                      <c.icon className={cn('mt-0.5 size-5 shrink-0', selected ? 'text-primary' : 'text-muted')} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-label-large text-heading">{c.label}</span>
                        <span className="block text-body-small text-muted">{c.help}</span>
                      </span>
                    </button>
                    {selected && c.value === 'later' && (
                      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pl-12">
                        <span className="text-body-small text-muted">Get back to me in</span>
                        {MONTHS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            aria-pressed={months === m}
                            onClick={() => setMonths(m)}
                            className={cn(
                              'min-h-9 cursor-pointer rounded-full border px-3.5 text-label-medium transition-colors',
                              months === m ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-heading hover:bg-surface-2',
                            )}
                          >
                            {m} month{m > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {save.isError && (
              <p className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-body-medium text-danger" role="alert">
                {save.error.message}
              </p>
            )}

            <Button className="mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={!choice || save.isPending} onClick={() => choice && save.mutate(choice)}>
              {save.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
