export interface MECENode {
  id: string
  label: string
  description: string
  depth: number
  parentId: string | null
  decomposable: boolean
}

export interface DecomposeResponse {
  confidence: 'high' | 'medium' | 'low'
  confidence_reason?: string
  categories: {
    name: string
    description: string
    decomposable: boolean
  }[]
}

export interface ConfidenceNotification {
  confidence: 'medium' | 'low'
  reason: string
}

export const DEPTH_COLORS = [
  '#d97757',
  '#6a9bcc',
  '#788c5d',
  '#b07cc6',
  '#d4a259',
  '#6aadad',
] as const

export function depthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length]
}
