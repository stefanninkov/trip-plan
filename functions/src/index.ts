import { setGlobalOptions } from 'firebase-functions/v2'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './prompts/system-prompt.js'
import { buildUserMessage } from './prompts/user-prompt.js'

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

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() })

    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(inputs) }],
      })

      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      if (!textBlock) {
        res.status(502).json({ error: 'No text content in Claude response' })
        return
      }

      const jsonText = textBlock.text.trim().replace(/^```json\s*/, '').replace(/```$/, '')
      let plan: unknown
      try {
        plan = JSON.parse(jsonText)
      } catch {
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
      res.status(500).json({ error: msg })
    }
  }
)
