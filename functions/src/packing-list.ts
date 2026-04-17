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

const SYSTEM = `You build a practical, traveler-ready packing list from a trip itinerary.

Rules:
1. Tailor the list to the destinations, the season, the weather note, the activities in each day, the accommodation type, and the number of travelers.
2. Keep it lean — no padding. Each item should earn its place.
3. Use categories that match what the trip actually needs. Common categories: "Clothing", "Footwear", "Toiletries", "Electronics", "Documents & Money", "Day-bag essentials", "Medical & Safety", "Activity-specific" (e.g. hiking, swimming, skiing).
4. When an activity in the plan demands it, add a dedicated item (e.g. "Swimsuit" if any beach day, "Hiking boots" if any trail, "Adapter type X" based on destination country, "Umbrella / rain jacket" if weather note mentions rain).
5. Return JSON ONLY (no markdown fences, no preamble) in this exact shape:
{
  "reasoning": "one short sentence explaining how the list was tailored",
  "categories": [
    {
      "title": "Clothing",
      "items": [
        { "name": "T-shirts", "qty": 5, "note": null },
        { "name": "Waterproof jacket", "qty": 1, "note": "Forecast has rain on day 3" }
      ]
    }
  ]
}
6. "qty" is integer or null. "note" is optional; only include when it adds real value (reason tied to the trip). Keep item names short (≤ 4 words).`

function buildUserMessage(plan: unknown, language: 'en' | 'sr'): string {
  const lang =
    language === 'sr'
      ? 'Write all free text (category titles, item names, notes, reasoning) in Serbian (Latin script). Keep country and city names in their original form.\n\n'
      : ''
  return (
    lang +
    'Build a packing list for this trip. Here is the full itinerary:\n\n' +
    JSON.stringify(plan)
  )
}

export const packingList = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    region: 'europe-west1',
    timeoutSeconds: 120,
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
    const lang =
      typeof language === 'string' && language.toLowerCase().startsWith('sr') ? 'sr' : 'en'

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildUserMessage(plan, lang) }],
      })

      if (msg.stop_reason === 'max_tokens') {
        res.status(502).json({ error: 'Output truncated', truncated: true })
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
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        res.status(502).json({ error: 'Invalid JSON', raw: text.text.slice(0, 400) })
        return
      }
      res.status(200).json({ packingList: parsed })
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      console.error('packingList failed:', m)
      res.status(500).json({ error: m })
    }
  }
)
