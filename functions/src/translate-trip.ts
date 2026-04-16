import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

const SYSTEM = `You translate travel itinerary JSON between English and Serbian (Latin script).

STRICT RULES:
1. Return the EXACT SAME JSON shape as the input — same keys, same ids, same structure, same array order. Do NOT add, remove or reorder fields.
2. Translate ONLY these free-text values: tripTitle, summary, weatherNote, bookAhead[], packingTips[], documentsNeeded[], appsToDownload[], day.title, day.location, block.title, block.description, block.whyPicked, block.historicalContext, block.tip, block.warning, cost.item, cost.note, hotel.highlight.
3. KEEP UNCHANGED: all ids, dates (YYYY-MM-DD), times (HH:MM-HH:MM), travelMode enum values, category enum values, tier enum values, currency codes, numbers (amount.min/max, pricePerNight, stars, dailyTotal, grandTotal, totalBudget, travelers, dayNumber).
4. Keep real place names, hotel names, restaurant names and landmark names in their ORIGINAL form — don't translate e.g. "Louvre" to anything else. You may add a Serbian clarifier in parentheses if useful.
5. Preserve currency formatting: a note that says "€60/person" must stay "€60/person" (or translate "/person" to "/po osobi" when going to Serbian, "/person" when going to English).
6. Respond ONLY with the translated JSON — no markdown, no preamble.`

export const translateTrip = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    region: 'europe-west1',
    timeoutSeconds: 180,
    memory: '512MiB',
  },
  async (req, res) => {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { plan, language } = (req.body ?? {}) as { plan?: unknown; language?: string }
    if (!plan || typeof plan !== 'object') {
      res.status(400).json({ error: 'Missing plan' })
      return
    }
    const target =
      typeof language === 'string' && language.toLowerCase().startsWith('sr')
        ? 'sr'
        : 'en'

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 32000,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content:
              `Translate this trip to ${target === 'sr' ? 'Serbian (Latin)' : 'English'}.\n\n` +
              JSON.stringify(plan),
          },
        ],
      })

      if (msg.stop_reason === 'max_tokens') {
        res.status(502).json({
          error: 'Output truncated while translating. Try a shorter trip.',
          truncated: true,
        })
        return
      }
      const text = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!text) {
        res.status(502).json({ error: 'No text in response' })
        return
      }
      let raw = text.text.trim()
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const first = raw.indexOf('{')
      const last = raw.lastIndexOf('}')
      if (first > 0 && last > first) raw = raw.slice(first, last + 1)
      let translated: unknown
      try {
        translated = JSON.parse(raw)
      } catch {
        res.status(502).json({ error: 'Invalid JSON', raw: text.text.slice(0, 400) })
        return
      }
      res.status(200).json({ plan: translated })
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      console.error('translateTrip failed:', m)
      res.status(500).json({ error: m })
    }
  }
)
