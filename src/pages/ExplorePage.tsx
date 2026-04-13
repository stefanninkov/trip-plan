import { useEffect, useState } from 'react'
import { Compass, Search, Loader2, History, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { AiProgress } from '@/components/shared/AiProgress'
import { useExplore } from '@/hooks/useExplore'
import {
  getExploreHistory,
  clearExploreHistory,
  type ExploreHistoryEntry,
} from '@/utils/explore-history'
import { ExploreResult } from '@/components/explore/ExploreResult'

const SUGGESTIONS = [
  'Tokyo, Japan',
  'Portugal',
  'Marrakech, Morocco',
  'New York City',
  'Vietnam',
  'Lisbon, Portugal',
  'Iceland',
]

export function ExplorePage() {
  const { t } = useTranslation()
  const EXPLORE_STAGES = [
    { at: 0, label: t('explore.stages.start') },
    { at: 15, label: t('explore.stages.history') },
    { at: 35, label: t('explore.stages.highlights') },
    { at: 55, label: t('explore.stages.neighborhoods') },
    { at: 75, label: t('explore.stages.food') },
    { at: 90, label: t('explore.stages.finish') },
  ]
  // The overview / loading / currentQuery are pulled from a module-level
  // store (see useExplore) so that generation keeps running when the user
  // switches tabs, and the Explore tab resumes exactly where it left off.
  const { loading, error, overview, currentQuery, run } = useExplore()
  const [query, setQuery] = useState(currentQuery ?? '')
  const [history, setHistory] = useState<ExploreHistoryEntry[]>(() => getExploreHistory())

  // Sync the input when a background request finishes populating the store.
  useEffect(() => {
    if (currentQuery && currentQuery !== query) {
      setQuery(currentQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery])

  // Refresh the localStorage history list whenever the store updates the
  // current overview (i.e. a run just succeeded).
  useEffect(() => {
    setHistory(getExploreHistory())
  }, [overview])

  const submit = (q: string): void => {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuery(trimmed)
    void run(trimmed)
  }

  const openHistory = (entry: ExploreHistoryEntry): void => {
    submit(entry.query)
  }

  const clearHistory = (): void => {
    clearExploreHistory()
    setHistory([])
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-text-secondary text-[13px] uppercase tracking-[1.5px]">{t('nav.explore')}</p>
        <h1 className="flex items-center gap-2.5">
          <Compass size={28} className="text-accent shrink-0" />
          {t('explore.heading')}
        </h1>
        <p className="text-text-secondary max-w-2xl">{t('explore.subheading')}</p>

        <form
          className="flex gap-2 mt-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit(query)
          }}
        >
          <div className="flex-1">
            <Input
              placeholder={t('explore.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            <span className="flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {loading ? t('explore.exploring') : t('explore.button')}
            </span>
          </Button>
        </form>

        {!overview && !loading && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-[12px] text-text-tertiary mr-1 self-center">{t('explore.try')}</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="px-3 py-1.5 rounded-full border border-border-default bg-bg-secondary text-[12px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="text-error text-[13px]">{error}</div>
          </div>
        </Card>
      )}

      {loading && (
        <AiProgress stages={EXPLORE_STAGES} timeConstant={8} hint={t('explore.hint')} />
      )}

      {overview && !loading && <ExploreResult overview={overview} />}

      {history.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-border-subtle pt-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <History size={16} className="text-accent" />
              {t('explore.recentlyExplored')}
            </h2>
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={12} />
              {t('common.clear')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <button
                key={h.query}
                type="button"
                onClick={() => openHistory(h)}
                className="px-3 py-1.5 rounded-full border border-border-default bg-bg-secondary text-[12px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
              >
                {h.name}
                {h.country && h.name !== h.country && (
                  <span className="text-text-tertiary">, {h.country}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
