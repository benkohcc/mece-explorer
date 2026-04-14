import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/prompts'
import { DecomposeResponse } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { topic, path } = (await req.json()) as { topic: string; path: string[] }

    const userPrompt =
      path.length > 1
        ? `We are doing a MECE decomposition. Full path: ${path.join(' → ')}. Now break down "${path.at(-1)}" into MECE sub-categories within the context of the root topic "${path[0]}".`
        : `Break down this topic into MECE categories: "${topic}"`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    const parsed: DecomposeResponse = JSON.parse(
      text.replace(/```json|```/g, '').trim()
    )

    return Response.json(parsed)
  } catch (error) {
    console.error('Decompose error:', error)
    return Response.json(
      { error: 'Failed to decompose. Try again.' },
      { status: 500 }
    )
  }
}
