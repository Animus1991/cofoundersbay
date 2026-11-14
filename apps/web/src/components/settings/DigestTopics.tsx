'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DIGEST_TOPIC_COPY, DIGEST_TOPICS, type DigestTopic } from '@cofounderbay/shared';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { FailedLine } from '@/components/dashboard/SectionCard';
import { getDigestTopics, updateDigestTopic } from '@/lib/api';
import { bilingualAria } from '@/lib/i18n/format';
import { usePageControls, usePageList } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';

const TOPICS_KEY = qk('notifications', 'digest-topics');

const topicRows = (topics: readonly DigestTopic[]) =>
  topics.map((t) => ({ value: t, labelEn: DIGEST_TOPIC_COPY[t].en, labelEl: DIGEST_TOPIC_COPY[t].el }));

/**
 * What the email digest carries, one switch per topic, saved to the account
 * (`/digests/preferences`). The digest job always read these switches, but no
 * screen set them, so "Updates from people you follow" and "Suggested matches"
 * could be neither seen nor turned off. Each switch writes its own topic
 * only; nothing shows until the read succeeds, so a default never overwrites
 * a stored choice.
 */
export function DigestTopics({ digestOff }: { digestOff: boolean }) {
  const queryClient = useQueryClient();
  const { error: toastError } = useToast();
  const topicsQuery = useQuery({ queryKey: TOPICS_KEY, queryFn: getDigestTopics, retry: 1 });
  const topics = topicsQuery.data;

  const save = useMutation({
    mutationFn: ({ topic, on }: { topic: DigestTopic; on: boolean }) => updateDigestTopic(topic, on),
    onMutate: async ({ topic, on }) => {
      await queryClient.cancelQueries({ queryKey: TOPICS_KEY });
      const before = queryClient.getQueryData<Record<DigestTopic, boolean>>(TOPICS_KEY);
      if (before) queryClient.setQueryData(TOPICS_KEY, { ...before, [topic]: on });
      return { before };
    },
    onError: (_e, _v, context) => {
      if (context?.before) queryClient.setQueryData(TOPICS_KEY, context.before);
      toastError('Could not save the digest', 'Please try again.');
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: TOPICS_KEY }),
  });

  const included = topics ? DIGEST_TOPICS.filter((t) => topics[t]) : [];
  const left = topics ? DIGEST_TOPICS.filter((t) => !topics[t]) : [];
  // Each is the other's exact undo: one stored flag for one topic.
  usePageControls([
    {
      id: 'digest_topic_on',
      labelEn: 'Include in the email digest',
      labelEl: 'Συμπερίληψη στην email σύνοψη',
      writes: true,
      options: topicRows(left),
      unavailableEn: !topics ? 'The digest topics have not been read.' : left.length ? undefined : 'Every topic is already in the digest.',
      unavailableEl: !topics ? 'Τα θέματα της σύνοψης δεν έχουν διαβαστεί.' : left.length ? undefined : 'Όλα τα θέματα είναι ήδη στη σύνοψη.',
      undo: (v) => ({ control: 'digest_topic_off', value: v }),
      run: async (v) => { if (v) await save.mutateAsync({ topic: v as DigestTopic, on: true }); },
    },
    {
      id: 'digest_topic_off',
      labelEn: 'Leave out of the email digest',
      labelEl: 'Εξαίρεση από την email σύνοψη',
      writes: true,
      options: topicRows(included),
      unavailableEn: !topics ? 'The digest topics have not been read.' : included.length ? undefined : 'No topic is in the digest.',
      unavailableEl: !topics ? 'Τα θέματα της σύνοψης δεν έχουν διαβαστεί.' : included.length ? undefined : 'Κανένα θέμα δεν είναι στη σύνοψη.',
      undo: (v) => ({ control: 'digest_topic_on', value: v }),
      run: async (v) => { if (v) await save.mutateAsync({ topic: v as DigestTopic, on: false }); },
    },
  ]);
  usePageList([
    {
      id: 'digest_topics',
      labelEn: 'What the email digest includes',
      labelEl: 'Τι περιλαμβάνει η email σύνοψη',
      rows: topics ? DIGEST_TOPICS.map((t) => `${DIGEST_TOPIC_COPY[t].en}: ${topics[t] ? 'included' : 'left out'}`) : undefined,
      rowsEl: topics ? DIGEST_TOPICS.map((t) => `${DIGEST_TOPIC_COPY[t].el}: ${topics[t] ? 'περιλαμβάνεται' : 'εξαιρείται'}`) : undefined,
    },
  ]);

  return (
    <div className="space-y-3 px-4 py-4 sm:px-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          <BilingualText en="What the digest includes" el="Τι περιλαμβάνει η σύνοψη" compact />
        </p>
        <p className="text-sm text-muted-foreground">
          <BilingualText
            en={digestOff ? 'Saved for when you turn the digest on. Each topic is in unless you turn it off.' : 'Each topic is in unless you turn it off.'}
            el={digestOff ? 'Αποθηκεύεται για όταν ενεργοποιήσετε τη σύνοψη. Κάθε θέμα μπαίνει, εκτός αν το απενεργοποιήσετε.' : 'Κάθε θέμα μπαίνει, εκτός αν το απενεργοποιήσετε.'}
            compact
            wrap
          />
        </p>
      </div>
      {topicsQuery.isError && !topics ? (
        <FailedLine
          en="Which topics the digest includes could not be read just now."
          el="Τα θέματα της σύνοψης δεν διαβάστηκαν αυτή τη στιγμή."
          onRetry={() => void topicsQuery.refetch()}
          busy={topicsQuery.isFetching}
        />
      ) : topics ? (
        <ul className="card-rows">
          {DIGEST_TOPICS.map((topic) => {
            const copy = DIGEST_TOPIC_COPY[topic];
            return (
              <li key={topic} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-foreground"><BilingualText en={copy.en} el={copy.el} compact /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en={copy.detailEn} el={copy.detailEl} compact wrap /></p>
                </div>
                <Switch
                  checked={topics[topic]}
                  disabled={save.isPending && save.variables?.topic === topic}
                  onCheckedChange={(on) => save.mutate({ topic, on })}
                  aria-label={bilingualAria(`${copy.en} in the email digest`, `${copy.el} στην email σύνοψη`)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Reading the digest topics…" el="Ανάγνωση των θεμάτων της σύνοψης…" compact />
        </p>
      )}
    </div>
  );
}
