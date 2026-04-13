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

const SYSTEM = `You are a knowledgeable travel writer and historian. Given a single itinerary block, enrich it with deeper context for a curious traveler.

Return ONLY a JSON object with this shape, no markdown:
{
  "description": string,           // Rewritten longer description (3-5 sentences). Preserve the same activity but add sensory details, what you'll actually experience, what to look out for.
  "whyPicked": string,             // 2-3 sentences on why this specific place/activity fits the trip and what makes it stand out.
  "historicalContext": string | null,  // 3-5 sentences on history, cultural significance, architectural notes, famous people connected. null if genuinely nothing historical to add.
  "tip": string | null,            // One concrete, practical pro tip (what to try, when to arrive, how to beat lines). null if none.
  "warning": string | null         // One heads-up (seasonal closures, dress code, safety). null if none.
}

Keep facts accurate. No speculation. If you are uncertain about a detail, leave it out.`

export const enrichBlock = onRequest(
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

    const { block, location, dayTitle } = (req.body ?? {}) as {
      block?: { title: string; description: string; time: string }
      location?: string
      dayTitle?: string
    }

    if (!block || !block.title) {
      res.status(400).json({ error: 'Missing block' })
      return
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })
    const userMessage = `Itinerary block to enrich:
- Activity: ${block.title}
- Current description: ${block.description || '(none)'}
- Time: ${block.time}
- Location: ${location ?? 'unknown'}
- Day context: ${dayTitle ?? ''}

Return the enriched JSON now.`

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      })
      const text = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!text) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }
      const json = text.text.trim().replace(/^```json\s*/, '').replace(/```$/, '')
      let enriched: unknown
      try {
        enriched = JSON.parse(json)
      } catch {
        res
          .status(502)
          .json({ error: 'Claude returned invalid JSON', raw: text.text.slice(0, 500) })
        return
      }
      res.status(200).json({ enriched })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('enrichBlock failed:', msg)
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
