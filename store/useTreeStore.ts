import { create } from 'zustand'
import { MECENode, ConfidenceNotification } from '@/lib/types'
import { decompose, explain } from '@/lib/api'

interface TreeState {
  topic: string
  nodes: MECENode[]
  expandedIds: Set<string>
  loadingId: string | null
  error: string | null
  notifications: Record<string, ConfidenceNotification>
  selectedNodeId: string | null
  explanations: Record<string, string>
  explanationLoading: boolean
  explanationError: string | null

  setTopic: (topic: string) => void
  initRoot: (topic: string) => Promise<void>
  expandNode: (node: MECENode) => Promise<void>
  toggleExpanded: (nodeId: string) => void
  dismissNotification: (nodeId: string) => void
  selectNode: (node: MECENode) => Promise<void>
  closePanel: () => void
  reset: () => void
  getPath: (node: MECENode) => string[]
  getChildren: (nodeId: string) => MECENode[]
}

export const useTreeStore = create<TreeState>((set, get) => ({
  topic: '',
  nodes: [],
  expandedIds: new Set(),
  loadingId: null,
  error: null,
  notifications: {},
  selectedNodeId: null,
  explanations: {},
  explanationLoading: false,
  explanationError: null,

  setTopic: (topic) => set({ topic }),

  initRoot: async (topic) => {
    const rootId = 'root'
    const root: MECENode = {
      id: rootId,
      label: topic,
      depth: 0,
      parentId: null,
      description: 'Root topic',
      decomposable: true,
    }
    set({
      topic,
      nodes: [root],
      expandedIds: new Set(),
      loadingId: rootId,
      error: null,
      notifications: {},
    })

    try {
      const r = await decompose(topic, [topic])
      const kids: MECENode[] = r.categories.map((c, i) => ({
        id: `${rootId}-${i}`,
        label: c.name,
        description: c.description,
        depth: 1,
        parentId: rootId,
        decomposable: c.decomposable !== false,
      }))
      set(s => ({
        nodes: [...s.nodes, ...kids],
        expandedIds: new Set([rootId]),
        loadingId: null,
        notifications:
          r.confidence !== 'high'
            ? {
                ...s.notifications,
                [rootId]: {
                  confidence: r.confidence,
                  reason: r.confidence_reason || 'Decomposition may not be fully MECE.',
                },
              }
            : s.notifications,
      }))
    } catch {
      set({ error: 'Failed to generate breakdown. Please try again.', loadingId: null })
    }
  },

  expandNode: async (node) => {
    const { expandedIds, loadingId } = get()
    if (expandedIds.has(node.id) || loadingId) return

    set({ loadingId: node.id, error: null })
    const path = get().getPath(node)

    try {
      const r = await decompose(get().topic, path)
      const kids: MECENode[] = r.categories.map((c, i) => ({
        id: `${node.id}-${i}`,
        label: c.name,
        description: c.description,
        depth: node.depth + 1,
        parentId: node.id,
        decomposable: c.decomposable !== false,
      }))
      set(s => ({
        nodes: [...s.nodes, ...kids],
        expandedIds: new Set([...s.expandedIds, node.id]),
        loadingId: null,
        notifications:
          r.confidence !== 'high'
            ? {
                ...s.notifications,
                [node.id]: {
                  confidence: r.confidence,
                  reason:
                    r.confidence_reason || 'Further decomposition may not be fully MECE.',
                },
              }
            : s.notifications,
      }))
    } catch {
      set({ error: 'Failed to expand. Try again.', loadingId: null })
    }
  },

  toggleExpanded: (nodeId) =>
    set(s => {
      const next = new Set(s.expandedIds)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return { expandedIds: next }
    }),

  selectNode: async (node) => {
    set({ selectedNodeId: node.id, explanationError: null })
    if (get().explanations[node.id]) return

    set({ explanationLoading: true })
    const path = get().getPath(node)
    try {
      const text = await explain(get().topic, path, node.label, node.description)
      set((s) => ({
        explanations: { ...s.explanations, [node.id]: text },
        explanationLoading: false,
      }))
    } catch {
      set({
        explanationLoading: false,
        explanationError: 'Failed to load explanation. Try again.',
      })
    }
  },

  closePanel: () => set({ selectedNodeId: null, explanationError: null }),

  dismissNotification: (nodeId) =>
    set(s => {
      const n = { ...s.notifications }
      delete n[nodeId]
      return { notifications: n }
    }),

  reset: () =>
    set({
      topic: '',
      nodes: [],
      expandedIds: new Set(),
      loadingId: null,
      error: null,
      notifications: {},
      selectedNodeId: null,
      explanations: {},
      explanationLoading: false,
      explanationError: null,
    }),

  getPath: (node) => {
    const path: string[] = []
    const { nodes } = get()
    let cur: MECENode | undefined = node
    while (cur) {
      path.unshift(cur.label)
      const parentId: string | null = cur.parentId
      cur = parentId ? nodes.find(n => n.id === parentId) : undefined
    }
    return path
  },

  getChildren: (nodeId) => get().nodes.filter(n => n.parentId === nodeId),
}))
