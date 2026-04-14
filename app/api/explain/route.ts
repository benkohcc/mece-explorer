import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const EXPLAIN_SYSTEM_PROMPT = `You are an expert educator. Given a category that sits within a MECE decomposition tree, produce a concise, substantive explanation for someone trying to deeply understand it.

Structure your response as plain markdown with these sections (use ## headers):
## What it is
2–3 sentence definition, precise and non-generic.
## Why it matters
Why this category is worth isolating within the parent topic — what unique aspect it captures.
## Key aspects
3–5 bullet points covering the most important sub-dimensions, considerations, or dynamics.
## Examples
2–3 concrete examples that make the category tangible.

Rules:
- Keep the full response under 300 words.
- Stay tightly scoped to the category within its parent context — do not wander.
- No preamble, no conclusion, no meta-commentary. Just the four sections.`

export async function POST(req: Request) {
  try {
    const { topic, path, label, description } = (await req.json()) as {
      topic: string
      path: string[]
      label: string
      description: string
    }

    const pathStr = path.join(' → ')
    const userPrompt = `Root topic: "${topic}"
Full path: ${pathStr}
Category: "${label}"
Short description: ${description}

Give a detailed explanation of this category within its context.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: EXPLAIN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return Response.json({ explanation: text })
  } catch (error) {
    console.error('Explain error:', error)
    return Response.json({ error: 'Failed to fetch explanation.' }, { status: 500 })
  }
}
