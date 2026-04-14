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

const SYSTEM = `You turn a short free-form trip description into structured wizard inputs.

Return ONLY a valid JSON object (no markdown, no preamble) with these fields, any of which MAY be omitted when the user didn't mention it:

{
  "origin": string,                  // "City, Country" — where they're flying from
  "originCountry": string,
  "destinations": [
    { "city": string, "country": string, "startDate"?: "YYYY-MM-DD", "endDate"?: "YYYY-MM-DD" }
  ],
  "startDate"?: "YYYY-MM-DD",
  "endDate"?: "YYYY-MM-DD",
  "travelers": number,
  "budgetLevel": "budget" | "mid" | "comfortable" | "luxury",
  "interests": string[],            // short tags like "food", "history", "hiking"
  "pace": "relaxed" | "moderate" | "packed",
  "accommodationType": "hostel" | "hotel" | "apartment" | "villa" | "house" | "bnb" | "resort" | "any",
  "notes": string
}

- If the user says "late April" or "next month" etc., use concrete YYYY-MM-DD that best matches based on the current date provided.
- If travelers aren't stated, assume 2.
- If budget isn't stated, assume "mid".
- Interests are short lowercase English tags even if the user speaks in Serbian.`

export const parseWizardVoice = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    region: 'europe-west1',
    timeoutSeconds: 30,
    memory: '256MiB',
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

    const { transcript, today } = (req.body ?? {}) as {
      transcript?: string
      today?: string
    }
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Missing transcript' })
      return
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 2 })

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Today is ${today ?? new Date().toISOString().slice(0, 10)}.\n\nTrip description:\n"${transcript}"\n\nReturn only the JSON object.`,
          },
        ],
      })

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
      res.status(200).json({ inputs: parsed })
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      console.error('parseWizardVoice failed:', m)
      res.status(500).json({ error: m })
    }
  }
)
