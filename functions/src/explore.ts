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

const EXPLORE_SYSTEM_PROMPT = `You are an expert local travel guide producing a rich travel overview for a country, region, or city.

RULES:
1. Use REAL, specific place names \u2014 actual neighborhoods, restaurants, landmarks, hotels.
2. Every "why" / "note" / "vibe" field should be 2-3 sentences with concrete detail.
3. For specific locations (highlights, restaurants, activities, neighborhoods, stay areas) include a "mapsQuery" and "address" when applicable. Set both to null for abstract items (e.g., "street food").
4. Respond ONLY with a valid JSON object matching the schema. No markdown, no preamble, no code fences. Keep the response as compact as possible while staying complete.

OUTPUT SCHEMA:
{
  "name": string,
  "country": string,
  "kind": "city" | "country" | "region",
  "centerQuery": string,
  "summary": string,
  "bestTimeToVisit": string,
  "howManyDays": string,
  "history": string,
  "highlights": [{
    "name": string,
    "why": string,
    "category": "landmark" | "museum" | "nature" | "experience" | "nightlife" | "other",
    "address": string | null,
    "mapsQuery": string | null,
    "priceHint": string | null,
    "duration": string | null
  }],
  "neighborhoods": [{
    "name": string,
    "vibe": string,
    "goodFor": string,
    "anchors": [string],
    "mapsQuery": string | null
  }],
  "food": [{
    "name": string,
    "note": string,
    "address": string | null,
    "mapsQuery": string | null,
    "priceHint": string | null
  }],
  "wheretoStay": [{
    "area": string,
    "tier": "budget" | "mid" | "comfortable" | "luxury",
    "why": string,
    "examples": [string],
    "priceHint": string | null,
    "mapsQuery": string | null
  }],
  "activities": [{
    "name": string,
    "note": string,
    "address": string | null,
    "mapsQuery": string | null,
    "priceHint": string | null,
    "duration": string | null
  }],
  "gettingAround": string,
  "tips": [string],
  "watchouts": [string]
}

COUNTS: 6-8 highlights, 4-5 neighborhoods, 5-6 food, 4-5 wheretoStay, 6-8 activities, 4 tips, 2-3 watchouts.`

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

    const { query, language } = req.body ?? {}
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Missing query' })
      return
    }
    const lang = typeof language === 'string' ? language : 'en'
    const languageInstruction =
      lang === 'sr'
        ? 'Respond in Serbian (Latin script). Write summary, history, bestTimeToVisit, howManyDays, gettingAround, every "why" / "note" / "vibe" / "goodFor" field, tips, watchouts and all free-text in Serbian. Keep real place names (restaurants, neighborhoods, landmarks, hotels) in their original form. Keep mapsQuery in English so Google Maps can find the location.\n\n'
        : ''

    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY.value(),
      maxRetries: 3,
    })

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: EXPLORE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: languageInstruction + buildExplorePrompt(query.trim()),
          },
        ],
      })

      if (message.stop_reason === 'max_tokens') {
        console.error('exploreDestination: truncated at max_tokens', message.usage)
        res.status(502).json({
          error:
            'The overview was too long for one response. Try a more specific query (e.g., a single city).',
          truncated: true,
        })
        return
      }

      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!textBlock) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }

      // Tolerant JSON extractor: strip markdown fences, trim to the outer
      // {...} block. Guards against preambles like "Here's the overview:".
      let jsonText = textBlock.text.trim()
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
      const first = jsonText.indexOf('{')
      const last = jsonText.lastIndexOf('}')
      if (first > 0 && last > first) {
        jsonText = jsonText.slice(first, last + 1)
      }
      let overview: unknown
      try {
        overview = JSON.parse(jsonText)
      } catch (parseErr) {
        console.error(
          'exploreDestination: JSON parse failed',
          parseErr instanceof Error ? parseErr.message : parseErr,
          textBlock.text.slice(0, 800)
        )
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
