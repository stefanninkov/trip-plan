import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

const EXPLORE_SYSTEM_PROMPT = `You are an expert local travel guide. When the user names a country, region, or city, you produce a rich but scannable overview.

RULES:
1. Use REAL place names (neighborhoods, restaurants, landmarks).
2. Be specific: prefer "Kadik\u00F6y ferry terminal" over "the waterfront area".
3. Keep each string concise \u2014 you are producing scannable cards, not essays.
4. Respond ONLY with a valid JSON object matching the schema below. No markdown, no preamble, no code fences.

OUTPUT SCHEMA:
{
  "name": string,              // canonical name of the place
  "country": string,            // country (or "" if the input is already a country)
  "kind": "city" | "country" | "region",
  "summary": string,            // 2-3 sentence overview
  "bestTimeToVisit": string,    // e.g. "April\u2013June and September\u2013October for mild weather"
  "howManyDays": string,        // e.g. "3\u20135 days gives you the highlights"
  "history": string,            // 3-5 sentences on history and cultural context
  "highlights": [               // top 5-8 must-see things
    { "name": string, "why": string, "category": "landmark" | "museum" | "nature" | "experience" | "nightlife" | "other" }
  ],
  "neighborhoods": [            // 3-6 areas worth knowing about (cities) OR best cities to visit (countries/regions)
    { "name": string, "vibe": string, "goodFor": string }
  ],
  "food": [                     // 4-6 iconic dishes or must-try restaurants
    { "name": string, "note": string }
  ],
  "wheretoStay": [              // 3-5 neighborhoods/areas with accommodation recommendations
    { "area": string, "tier": "budget" | "mid" | "comfortable" | "luxury", "why": string }
  ],
  "activities": [               // 5-8 things to actually do
    { "name": string, "note": string }
  ],
  "gettingAround": string,      // 1-2 sentences on transit / walkability
  "tips": [string],             // 3-5 insider tips
  "watchouts": [string]         // 2-3 things to avoid / be careful about
}`

function buildExplorePrompt(query: string): string {
  return `Give me a travel overview for: ${query}

Respond ONLY with valid JSON matching the schema in the system prompt.`
}

export const exploreDestination = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    timeoutSeconds: 120,
    memory: '512MiB',
    region: 'europe-west1',
    maxInstances: 5,
  },
  async (req, res) => {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { query } = req.body ?? {}
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Missing query' })
      return
    }

    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY.value(),
      maxRetries: 3,
    })

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: EXPLORE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildExplorePrompt(query.trim()) }],
      })

      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!textBlock) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }

      const jsonText = textBlock.text.trim().replace(/^```json\s*/, '').replace(/```$/, '')
      let overview: unknown
      try {
        overview = JSON.parse(jsonText)
      } catch {
        res.status(502).json({
          error: 'Claude returned invalid JSON',
          raw: textBlock.text.slice(0, 500),
        })
        return
      }

      res.status(200).json({ overview, usage: message.usage })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('exploreDestination failed:', msg)
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
