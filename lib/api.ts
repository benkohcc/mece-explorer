import { DecomposeResponse } from './types'

export async function decompose(topic: string, path: string[]): Promise<DecomposeResponse> {
  const res = await fetch('/api/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, path }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function explain(
  topic: string,
  path: string[],
  label: string,
  description: string
): Promise<string> {
  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, path, label, description }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = (await res.json()) as { explanation: string }
  return data.explanation
}
