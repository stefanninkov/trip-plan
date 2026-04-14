import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './prompts/system-prompt.js'

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

const MAX_FETCH_BYTES = 500_000 // 500 KB cap so we don't load giant pages

async function fetchReadable(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; TripPlanBot/1.0; +https://stefanninkov.github.io/trip-plan)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const text = new TextDecoder('utf-8').decode(
      buf.byteLength > MAX_FETCH_BYTES ? buf.slice(0, MAX_FETCH_BYTES) : buf
    )
    // Strip scripts / styles then keep visible text.
    const cleaned = text
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return cleaned.slice(0, 40_000)
  } catch {
    return null
  }
}

export const importTrip = onRequest(
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

    const { url, language } = (req.body ?? {}) as { url?: string; language?: string }
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'Invalid URL' })
      return
    }

    const article = await fetchReadable(url)
    if (!article) {
      res.status(502).json({ error: 'Could not fetch that URL' })
      return
    }

    const lang = typeof language === 'string' ? language : 'en'
    const langInstruction =
      lang === 'sr'
        ? 'Respond in Serbian (Latin). Keep real place names in their original form.\n\n'
        : ''

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 32000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content:
              langInstruction +
              `Below is the readable text of a travel article / blog post / shared itinerary at ${url}.\n\nYour job is to EXTRACT a structured trip plan from it matching the schema, filling in reasonable values where the source is vague. Use REAL place names from the article wherever possible; invent only what's missing. Follow the same CURRENCY and cost rules as when generating a trip from scratch (EUR primary everywhere).\n\n--- SOURCE ---\n${article}\n--- END SOURCE ---\n\nReturn only the JSON.`,
          },
        ],
      })

      if (msg.stop_reason === 'max_tokens') {
        res.status(502).json({ error: 'Output truncated; try a shorter article.', truncated: true })
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
      let plan: unknown
      try {
        plan = JSON.parse(raw)
      } catch {
        res.status(502).json({ error: 'Invalid JSON from Claude', raw: text.text.slice(0, 400) })
        return
      }
      res.status(200).json({ plan })
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      console.error('importTrip failed:', m)
      res.status(500).json({ error: m })
    }
  }
)
