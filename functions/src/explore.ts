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

const EXPLORE_SYSTEM_PROMPT = `You are an expert local travel guide producing a RICH travel overview for a country, region, or city.

RULES:
1. Use REAL, specific place names \u2014 actual neighborhoods, restaurants, landmarks, hotels, streets. Never invent.
2. Write MEATY descriptions. Every "why" / "note" / "vibe" / etc. field should be 2-4 sentences with concrete detail (atmosphere, opening times, what you\u2019ll see, what makes it special, cost range where relevant). No one-liners.
3. For every place that is a specific location (highlight, restaurant, activity, neighborhood, stay area), include a best-guess "address" (street + city) and a "mapsQuery" string that makes sense when pasted into Google Maps (e.g., "Pavilhao Chines Bar, Lisbon, Portugal"). If the item is abstract (e.g., "street food"), set both to null.
4. Prices: include "priceHint" when relevant (e.g., "\u20AC12\u201318 / plate" or "Free"). Times: include "duration" for activities / highlights where relevant (e.g., "1\u20132 hours").
5. For neighborhoods, include 2-3 specific "anchors" (landmarks, cafes, metro stops) the traveler can orient around.
6. For food, name at least one SPECIFIC restaurant (with address) per iconic dish where possible.
7. For where-to-stay, recommend named hotels or short-let areas with a price range.
8. Respond ONLY with a valid JSON object matching the schema below. No markdown, no preamble, no code fences.

OUTPUT SCHEMA:
{
  "name": string,                // canonical name of the place
  "country": string,              // country (or "" if the input is already a country)
  "kind": "city" | "country" | "region",
  "centerQuery": string,          // best Google-Maps-style query for the overall place (used to center maps)
  "summary": string,              // 3-5 sentences of overview
  "bestTimeToVisit": string,      // 2-3 sentences covering seasons, weather, crowds, festivals
  "howManyDays": string,          // 2 sentences on how long to stay and what you\u2019ll skip if shorter
  "history": string,              // 5-8 sentences on history, cultural context, why it matters today
  "highlights": [                 // 6-10 must-see things
    {
      "name": string,
      "why": string,               // 2-4 sentences: what makes it special, what you\u2019ll experience
      "category": "landmark" | "museum" | "nature" | "experience" | "nightlife" | "other",
      "address": string | null,    // street + city, or null for abstract items
      "mapsQuery": string | null,  // Google-Maps-friendly query, or null
      "priceHint": string | null,  // e.g. "\u20AC15 entry", "Free"
      "duration": string | null    // e.g. "1\u20132 hours"
    }
  ],
  "neighborhoods": [             // 4-6 areas worth knowing (for a city), or best cities (for country/region)
    {
      "name": string,
      "vibe": string,              // 2-3 sentences on atmosphere, who hangs out there, what it feels like at night
      "goodFor": string,           // 1-2 sentences on what this area is best for
      "anchors": [string],         // 2-3 specific landmarks / metro stops / cafes so the traveler can orient
      "mapsQuery": string | null
    }
  ],
  "food": [                      // 5-8 iconic dishes or must-try restaurants with SPECIFIC recommendations
    {
      "name": string,              // e.g., "Pastel de Nata at Manteigaria"
      "note": string,              // 2-4 sentences: what it is, taste, where it originated, best places
      "address": string | null,
      "mapsQuery": string | null,
      "priceHint": string | null
    }
  ],
  "wheretoStay": [               // 4-6 named areas or hotels with real recs
    {
      "area": string,
      "tier": "budget" | "mid" | "comfortable" | "luxury",
      "why": string,               // 2-3 sentences: who it suits, what\u2019s nearby, connectivity
      "examples": [string],        // 2-3 named hotels or hostels with price range
      "priceHint": string | null,  // nightly range e.g. "\u20AC80\u2013150"
      "mapsQuery": string | null
    }
  ],
  "activities": [                // 6-10 things to actually do with booking-level detail
    {
      "name": string,
      "note": string,              // 2-4 sentences: what the experience is, when/where to do it
      "address": string | null,
      "mapsQuery": string | null,
      "priceHint": string | null,
      "duration": string | null
    }
  ],
  "gettingAround": string,        // 3-5 sentences on transit, walkability, which passes to get
  "tips": [string],               // 4-6 insider tips, each 1-2 sentences
  "watchouts": [string]           // 2-4 things to avoid / scams / safety notes, each 1-2 sentences
}`

function buildExplorePrompt(query: string): string {
  return `Give me a RICH travel overview for: ${query}

Respond ONLY with valid JSON matching the schema in the system prompt. Remember: detailed 2-4 sentence descriptions on every item, real addresses + mapsQuery for every specific location, named restaurants / hotels / landmarks.`
}

export const exploreDestination = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    timeoutSeconds: 180,
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
        max_tokens: 8000,
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
