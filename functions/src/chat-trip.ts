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

const SYSTEM = `You are an expert travel planner helping a user iteratively refine their itinerary.

You MUST respond by calling exactly one of these tools:
- apply_patch: when the user asks for an edit. Produce a list of patch operations that modify the plan.
- reply_only: when the user asks a question or wants a discussion without changing the plan.

Patch ops are one of:
- { "op": "replace_day", "dayId": string, "day": <full DayPlan JSON> }
- { "op": "update_day_meta", "dayId": string, "patch": { "title"?: string, "location"?: string, "date"?: string } }
- { "op": "replace_block", "dayId": string, "blockId": string, "block": <full TimeBlock JSON> }
- { "op": "delete_block", "dayId": string, "blockId": string }
- { "op": "add_block", "dayId": string, "block": <full TimeBlock JSON> }
- { "op": "move_block", "fromDayId": string, "toDayId": string, "blockId": string, "newTime"?: string }
- { "op": "add_cost", "dayId": string, "cost": <full CostItem JSON> }
- { "op": "delete_cost", "dayId": string, "costId": string }

Write short, friendly replies. When applying a patch, also explain what you changed in 1-2 sentences in the "message" field.

Preserve IDs of items you aren't touching. Use stable ids like "block-3-new-2" for any added items.

Respond in the user's language (English or Serbian). Keep real place names in original form.`

const APPLY_PATCH_TOOL = {
  name: 'apply_patch',
  description: 'Apply a set of edits to the trip plan.',
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '1-2 sentence friendly explanation of what you just changed.',
      },
      ops: {
        type: 'array',
        description: 'Ordered patch operations to apply.',
        items: { type: 'object' },
      },
    },
    required: ['message', 'ops'],
  },
} as const

const REPLY_ONLY_TOOL = {
  name: 'reply_only',
  description: 'Reply without modifying the plan (e.g. the user asked a question).',
  input_schema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Your reply to the user.' },
    },
    required: ['message'],
  },
} as const

interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export const chatWithTrip = onRequest(
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

    const { plan, history, message, language } = (req.body ?? {}) as {
      plan?: unknown
      history?: ChatTurn[]
      message?: string
      language?: string
    }
    if (!plan || typeof plan !== 'object' || !message) {
      res.status(400).json({ error: 'Missing plan or message' })
      return
    }

    const lang = typeof language === 'string' ? language : 'en'
    const langInstruction =
      lang === 'sr'
        ? 'The user prefers Serbian (Latin script) — respond in Serbian. Keep real place names in their original form.\n\n'
        : ''

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 3 })

    // Compose conversation: prior history + plan context + new user msg.
    const priorTurns = Array.isArray(history)
      ? history
          .slice(-10)
          .map((t) => ({ role: t.role, content: t.text }))
          .filter((t): t is { role: 'user' | 'assistant'; content: string } => Boolean(t.content))
      : []

    const planContext = `Here is the current plan as JSON:\n\n${JSON.stringify(plan, null, 2)}\n\n---\n\nUser request: ${message}\n\n${langInstruction}Decide: does this require an edit? If yes, call apply_patch. If it's just a question, call reply_only.`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM,
        tools: [APPLY_PATCH_TOOL, REPLY_ONLY_TOOL],
        tool_choice: { type: 'any' },
        messages: [
          ...priorTurns.map((t) => ({
            role: t.role,
            content: t.content,
          })),
          { role: 'user', content: planContext },
        ],
      })

      const toolUse = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )
      if (!toolUse) {
        const text = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === 'text'
        )
        res.status(200).json({
          kind: 'reply_only',
          message: text?.text ?? '(no reply)',
          ops: [],
        })
        return
      }

      const input = toolUse.input as Record<string, unknown>
      if (toolUse.name === 'apply_patch') {
        res.status(200).json({
          kind: 'apply_patch',
          message: (input.message as string) ?? '',
          ops: (input.ops as unknown[]) ?? [],
        })
      } else {
        res.status(200).json({
          kind: 'reply_only',
          message: (input.message as string) ?? '',
          ops: [],
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('chatWithTrip failed:', msg)
      res.status(500).json({ error: msg })
    }
  }
)
