import { setGlobalOptions } from 'firebase-functions/v2'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './prompts/system-prompt.js'
import { buildUserMessage } from './prompts/user-prompt.js'

export { searchFlights, searchHotels, searchPlaces, searchWeb } from './search.js'
export { regenerateDay } from './regenerate-day.js'
export { enrichBlock } from './enrich-block.js'
export { exploreDestination } from './explore.js'

setGlobalOptions({ region: 'europe-west1', maxInstances: 5 })

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export const generateTrip = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    timeoutSeconds: 300,
    memory: '512MiB',
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

    const { inputs } = req.body ?? {}
    if (!inputs || typeof inputs !== 'object') {
      res.status(400).json({ error: 'Missing inputs' })
      return
    }

    const client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY.value(),
      maxRetries: 4,
    })

    try {
      // Use Sonnet 4.6 — faster and better than 4.0. Significantly speeds
      // up generation vs claude-sonnet-4-20250514.
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 32000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(inputs) }],
      })

      // If Claude hit max_tokens, the JSON is almost certainly truncated and
      // parsing will fail. Surface that explicitly so the client shows an
      // error instead of hanging on the invalid JSON.
      if (message.stop_reason === 'max_tokens') {
        console.error('generateTrip: output was truncated at max_tokens', message.usage)
        res.status(502).json({
          error:
            'The plan was too long for one response. Try reducing the number of destinations or shortening the trip.',
          truncated: true,
        })
        return
      }

      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!textBlock) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }

      // Tolerant JSON extractor: strip markdown fences, find the outer {...}.
      let jsonText = textBlock.text.trim()
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const first = jsonText.indexOf('{')
      const last = jsonText.lastIndexOf('}')
      if (first > 0 && last > first) {
        jsonText = jsonText.slice(first, last + 1)
      }
      let plan: unknown
      try {
        plan = JSON.parse(jsonText)
      } catch (parseErr) {
        console.error(
          'generateTrip: JSON parse failed',
          parseErr instanceof Error ? parseErr.message : parseErr,
          textBlock.text.slice(0, 800)
        )
        res.status(502).json({
          error: 'Claude returned invalid JSON',
          raw: textBlock.text.slice(0, 500),
        })
        return
      }

      res.status(200).json({ plan, usage: message.usage })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('generateTrip failed:', msg)

      // Surface the overloaded case to the client with a hint it's transient
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
