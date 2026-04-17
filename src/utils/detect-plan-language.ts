import type { TripPlan } from '@/types/trip-plan'

/**
 * Cheap heuristic to guess which language a TripPlan was written in.
 * We look at free-text fields (titles, descriptions, tips, weather note,
 * summary) and score them against small stopword lists for the languages
 * we support. We ignore real place names because those stay in their
 * original form regardless of the UI language.
 *
 * Returns 'sr' | 'en'. Defaults to 'en' when the text is too short or
 * ambiguous.
 */
export function detectPlanLanguage(plan: TripPlan): 'en' | 'sr' {
  const parts: string[] = [plan.tripTitle ?? '', plan.summary ?? '', plan.weatherNote ?? '']
  for (const d of plan.days) {
    if (d.title) parts.push(d.title)
    for (const b of d.blocks ?? []) {
      if (b.title) parts.push(b.title)
      if (b.description) parts.push(b.description)
      if (b.tip) parts.push(b.tip)
      if (b.warning) parts.push(b.warning)
      if (b.whyPicked) parts.push(b.whyPicked)
      if (b.historicalContext) parts.push(b.historicalContext)
    }
  }
  const text = parts.join(' ').toLowerCase()
  if (text.length < 20) return 'en'

  const srHits =
    text.match(
      /\b(je|su|sa|na|za|kao|ali|jer|ili|koji|koja|koje|nije|ovo|ova|ovde|tamo|jedan|jedna|najbolji|najbolje|vreme|grad|dan|pored|posle|pre|kroz)\b/g
    )?.length ?? 0
  const enHits =
    text.match(
      /\b(the|and|or|with|you|your|for|from|but|this|that|will|have|there|here|one|best|day|city|near|after|before|through)\b/g
    )?.length ?? 0

  if (srHits === enHits) {
    const diacritics = text.match(/[šđčćž]/g)?.length ?? 0
    return diacritics >= 3 ? 'sr' : 'en'
  }
  return srHits > enHits ? 'sr' : 'en'
}
