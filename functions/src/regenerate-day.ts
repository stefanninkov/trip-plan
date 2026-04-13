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

const SYSTEM = `You regenerate a single day of a travel itinerary.
Return ONLY a JSON object matching this TypeScript shape, no markdown:

{
  "id": string,
  "dayNumber": number,
  "date": "YYYY-MM-DD",
  "title": string,
  "location": string,
  "blocks": [{
    "id": string,
    "time": "HH:MM-HH:MM",
    "title": string,
    "description": string,
    "whyPicked": string | null,
    "historicalContext": string | null,
    "travelMode": "plane" | "train" | "car" | "bus" | "ferry" | "walk" | "bike" | "subway" | "taxi" | "scooter" | null,
    "tip": string | null,
    "warning": string | null
  }],
  "costs": [{
    "id": string,
    "item": string,
    "category": "transport" | "hotel" | "food" | "activity",
    "amount": { "min": number, "max": number },
    "currency": string,
    "note": string | null
  }],
  "dailyTotal": { "min": number, "max": number },
  "hotels": [{
    "name": string,
    "stars": number,
    "pricePerNight": number,
    "currency": string,
    "highlight": string,
    "tier": "budget" | "mid" | "comfortable"
  }] | null
}

Use REAL place names. Include hour-by-hour blocks, whyPicked and historicalContext.
Match the existing trip's tone, budget level, pace, and interests.`

export const regenerateDay = onRequest(
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

    const { inputs, day, instructions } = (req.body ?? {}) as {
      inputs?: unknown
      day?: { dayNumber: number; date: string; location: string; id: string }
      instructions?: string
    }

    if (!inputs || !day) {
      res.status(400).json({ error: 'Missing inputs or day' })
      return
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })
    const userMessage = `Trip inputs:\n${JSON.stringify(inputs, null, 2)}\n\nRegenerate day ${day.dayNumber} (${day.date}) in ${day.location}. Use this same id: "${day.id}".${
      instructions ? `\n\nExtra instructions: ${instructions}` : ''
    }\n\nReturn ONLY the day JSON.`

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      })
      const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!text) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }
      const json = text.text.trim().replace(/^```json\s*/, '').replace(/```$/, '')
      let dayPlan: unknown
      try {
        dayPlan = JSON.parse(json)
      } catch {
        res.status(502).json({ error: 'Claude returned invalid JSON', raw: text.text.slice(0, 500) })
        return
      }
      res.status(200).json({ day: dayPlan })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('regenerateDay failed:', msg)
      if (err instanceof Anthropic.APIError && err.status === 529) {
        res.status(503).json({
          error: 'Claude is temporarily overloaded. Please try again in a minute.',
          transient: true,
        })
        return
      }
      res.status(500).json({ error: msg })
    }
  }
)
