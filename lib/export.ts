import { MECENode } from './types'

export function toMarkdown(nodes: MECENode[]): string {
  const root = nodes.find(n => n.parentId === null)
  if (!root) return ''

  function walk(node: MECENode, depth: number): string {
    const prefix = '#'.repeat(Math.min(depth + 1, 6))
    const desc = node.description !== 'Root topic' ? `\n${node.description}\n` : '\n'
    const children = nodes.filter(n => n.parentId === node.id)
    const childText = children.map(c => walk(c, depth + 1)).join('\n')
    return `${prefix} ${node.label}\n${desc}${childText}`
  }

  return walk(root, 0).trim()
}

export function toJSON(topic: string, nodes: MECENode[]) {
  return { topic, nodes, exportedAt: new Date().toISOString() }
}
