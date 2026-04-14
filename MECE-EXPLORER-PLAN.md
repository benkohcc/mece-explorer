# MECE Explorer — Claude Code Implementation Plan

## Context

This is a standalone Next.js app that implements the MECE Explorer. The skill files (`mece-explorer/SKILL.md` and `mece-explorer/references/brand-and-layout.md`) are the authoritative spec — they define the UX flow, system prompt, data model, visual design, and component behavior. This plan tells you how to build it as a deployable app.

The working prototype is `mece-explorer.jsx` — a single React component that runs in Claude's artifact sandbox. It works end-to-end but calls the Anthropic API client-side. The production app routes API calls through a server-side route handler.

**Read the skill files first. They are the source of truth for what to build. This plan covers how to build it.**

---

## Tech Stack

```
Next.js 14          app router, server components where possible
Tailwind CSS        utility-first + CSS variables for brand tokens
Zustand             flat store for tree state
@anthropic-ai/sdk   server-side API calls
Vercel              deployment
```

---

## File Structure

```
mece-explorer/
├── app/
│   ├── layout.tsx                 # Root layout: fonts, metadata, globals
│   ├── page.tsx                   # Client component — entire app (start screen + tree view)
│   └── api/
│       └── decompose/
│           └── route.ts           # POST handler → Anthropic SDK
├── components/
│   ├── StartScreen.tsx            # Topic input, example chips, branding
│   ├── TreeView.tsx               # Header + table wrapper
│   ├── TreeRow.tsx                # Recursive row (the core component)
│   ├── Tooltip.tsx                # Hover description tooltip
│   ├── ConfidenceBanner.tsx       # Medium/low confidence notification row
│   └── ui/
│       ├── AnthropicMark.tsx      # SVG logo
│       ├── PlusMinusButton.tsx    # [+]/[−] expand control
│       ├── LeafDot.tsx            # Terminal node indicator
│       ├── LoadingDots.tsx        # Three-dot pulse animation
│       └── LeafBadge.tsx          # "LEAF" text badge
├── store/
│   └── useTreeStore.ts            # Zustand store
├── lib/
│   ├── types.ts                   # MECENode, DecomposeResponse, etc.
│   ├── prompts.ts                 # System prompt (copy from SKILL.md)
│   ├── api.ts                     # Client-side fetch wrapper for /api/decompose
│   └── export.ts                  # Markdown/JSON export helpers
├── styles/
│   └── globals.css                # CSS variables, animations, base reset
├── tailwind.config.ts
├── .env.local                     # ANTHROPIC_API_KEY
└── package.json
```

---

## Step-by-Step Build Order

### Step 1: Scaffold

```bash
npx create-next-app@14 mece-explorer --typescript --tailwind --app --src-dir=false
cd mece-explorer
npm install zustand @anthropic-ai/sdk
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 2: Brand Tokens + Global Styles

**`tailwind.config.ts`** — extend theme with Anthropic palette:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#141413',
          light: '#faf9f5',
          surface: '#fffefa',
          'surface-alt': '#f7f5ee',
          'surface-hover': '#f3f0e8',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          orange: '#d97757',
          'orange-hover': '#c4634a',
          'orange-light': '#fef2ee',
          blue: '#6a9bcc',
          green: '#788c5d',
          purple: '#b07cc6',
          gold: '#d4a259',
          teal: '#6aadad',
          border: '#e0ddd3',
          'border-strong': '#ccc9be',
          'text-primary': '#1a1a19',
          'text-secondary': '#5a584f',
          'text-muted': '#8a877d',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Arial', 'sans-serif'],
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

**`styles/globals.css`**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes tooltipIn {
  from { opacity: 0; transform: translateX(-50%) translateY(calc(-100% + 4px)); }
  to { opacity: 1; transform: translateX(-50%) translateY(-100%); }
}
@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 60px; }
}
```

**`app/layout.tsx`**:

```typescript
import { Poppins, Lora } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export const metadata = {
  title: 'MECE Explorer',
  description: 'Interactive MECE decomposition powered by Claude',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${lora.variable}`}>
      <body className="bg-brand-light font-poppins">{children}</body>
    </html>
  )
}
```

### Step 3: Types + Prompts

**`lib/types.ts`**:

```typescript
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
```

**`lib/prompts.ts`** — copy the system prompt verbatim from `SKILL.md` lines 73-106.

### Step 4: API Route

**`app/api/decompose/route.ts`**:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/prompts'
import { DecomposeResponse } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { topic, path } = await req.json() as { topic: string; path: string[] }

    const userPrompt = path.length > 1
      ? `We are doing a MECE decomposition. Full path: ${path.join(' → ')}. Now break down "${path.at(-1)}" into MECE sub-categories within the context of the root topic "${path[0]}".`
      : `Break down this topic into MECE categories: "${topic}"`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const parsed: DecomposeResponse = JSON.parse(
      text.replace(/```json|```/g, '').trim()
    )

    return Response.json(parsed)
  } catch (error) {
    // Retry once on parse failure
    console.error('Decompose error:', error)
    return Response.json(
      { error: 'Failed to decompose. Try again.' },
      { status: 500 }
    )
  }
}
```

**`lib/api.ts`** — client-side wrapper:

```typescript
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
```

### Step 5: Zustand Store

**`store/useTreeStore.ts`**:

```typescript
import { create } from 'zustand'
import { MECENode, ConfidenceNotification } from '@/lib/types'
import { decompose } from '@/lib/api'

interface TreeState {
  topic: string
  nodes: MECENode[]
  expandedIds: Set<string>
  loadingId: string | null
  error: string | null
  notifications: Record<string, ConfidenceNotification>

  setTopic: (topic: string) => void
  initRoot: (topic: string) => Promise<void>
  expandNode: (node: MECENode) => Promise<void>
  toggleExpanded: (nodeId: string) => void
  dismissNotification: (nodeId: string) => void
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

  setTopic: (topic) => set({ topic }),

  initRoot: async (topic) => {
    const rootId = 'root'
    const root: MECENode = {
      id: rootId, label: topic, depth: 0,
      parentId: null, description: 'Root topic', decomposable: true,
    }
    set({ topic, nodes: [root], expandedIds: new Set(), loadingId: rootId, error: null, notifications: {} })

    try {
      const r = await decompose(topic, [topic])
      const kids: MECENode[] = r.categories.map((c, i) => ({
        id: `${rootId}-${i}`, label: c.name, description: c.description,
        depth: 1, parentId: rootId, decomposable: c.decomposable !== false,
      }))
      set(s => ({
        nodes: [...s.nodes, ...kids],
        expandedIds: new Set([rootId]),
        loadingId: null,
        notifications: r.confidence !== 'high'
          ? { ...s.notifications, [rootId]: { confidence: r.confidence, reason: r.confidence_reason || 'Decomposition may not be fully MECE.' } }
          : s.notifications,
      }))
    } catch {
      set({ error: 'Failed to generate breakdown. Please try again.', loadingId: null })
    }
  },

  expandNode: async (node) => {
    const { expandedIds, loadingId, nodes } = get()
    if (expandedIds.has(node.id) || loadingId) return

    set({ loadingId: node.id, error: null })
    const path = get().getPath(node)

    try {
      const r = await decompose(get().topic, path)
      const kids: MECENode[] = r.categories.map((c, i) => ({
        id: `${node.id}-${i}`, label: c.name, description: c.description,
        depth: node.depth + 1, parentId: node.id, decomposable: c.decomposable !== false,
      }))
      set(s => ({
        nodes: [...s.nodes, ...kids],
        expandedIds: new Set([...s.expandedIds, node.id]),
        loadingId: null,
        notifications: r.confidence !== 'high'
          ? { ...s.notifications, [node.id]: { confidence: r.confidence, reason: r.confidence_reason || 'Further decomposition may not be fully MECE.' } }
          : s.notifications,
      }))
    } catch {
      set({ error: 'Failed to expand. Try again.', loadingId: null })
    }
  },

  toggleExpanded: (nodeId) => set(s => {
    const next = new Set(s.expandedIds)
    if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId)
    return { expandedIds: next }
  }),

  dismissNotification: (nodeId) => set(s => {
    const n = { ...s.notifications }; delete n[nodeId]; return { notifications: n }
  }),

  reset: () => set({ topic: '', nodes: [], expandedIds: new Set(), loadingId: null, error: null, notifications: {} }),

  getPath: (node) => {
    const path: string[] = []
    let cur: MECENode | undefined = node
    const { nodes } = get()
    while (cur) { path.unshift(cur.label); cur = nodes.find(n => n.id === cur!.parentId) }
    return path
  },

  getChildren: (nodeId) => get().nodes.filter(n => n.parentId === nodeId),
}))
```

### Step 6: Components

Build these components following the specs in `references/brand-and-layout.md`:

1. **`components/ui/AnthropicMark.tsx`** — SVG from brand ref line 86-93
2. **`components/ui/PlusMinusButton.tsx`** — 22×22px, depth-colored border, plus/minus SVG icons
3. **`components/ui/LeafDot.tsx`** — 6px circle at 35% opacity
4. **`components/ui/LeafBadge.tsx`** — "LEAF" text, `#e8e6dc` bg, 10px Poppins
5. **`components/ui/LoadingDots.tsx`** — 3 × 4px circles with staggered `dotPulse` animation
6. **`components/Tooltip.tsx`** — fixed position, dark bg, Lora text, arrow, 280px max-width. Spec on brand ref lines 149-168
7. **`components/ConfidenceBanner.tsx`** — yellow/orange sub-row. Spec on brand ref lines 172-191
8. **`components/TreeRow.tsx`** — recursive `<tr>`. This is the core component. Row spec on brand ref lines 116-147. Connects to Zustand store for expand/toggle/loading state
9. **`components/TreeView.tsx`** — sticky header + table wrapper + error banner
10. **`components/StartScreen.tsx`** — topic input, chips, branding. Layout spec on brand ref lines 70-79

### Step 7: Page

**`app/page.tsx`**:

```typescript
'use client'

import { useTreeStore } from '@/store/useTreeStore'
import StartScreen from '@/components/StartScreen'
import TreeView from '@/components/TreeView'

export default function Home() {
  const nodes = useTreeStore(s => s.nodes)
  const started = nodes.length > 0

  return started ? <TreeView /> : <StartScreen />
}
```

### Step 8: Export (Optional, add after core works)

**`lib/export.ts`**:

```typescript
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
```

---

## Deployment

```bash
# Vercel (zero-config)
npx vercel

# Or build locally
npm run build
npm start
```

Only env var needed: `ANTHROPIC_API_KEY`

---

## Testing Checklist

- [ ] Start screen renders with Anthropic branding
- [ ] Topic input → Decompose → tree appears with 3-6 categories
- [ ] Hover any row → tooltip shows description
- [ ] Click [+] on leaf → API call → children appear indented
- [ ] [+] becomes [−] → toggle hides/shows without re-fetch
- [ ] `decomposable: false` → leaf dot + LEAF badge, no [+]
- [ ] Medium confidence → yellow banner with reason
- [ ] Low confidence → orange banner with reason
- [ ] Banner × dismiss works
- [ ] Depth 4+ expansion sends correct ancestry path
- [ ] Loading dots animate during fetch
- [ ] API error → error banner, tree intact
- [ ] "New" button resets everything
- [ ] Sticky header stays on scroll
- [ ] Tooltip doesn't overflow viewport
- [ ] Poppins for chrome, Lora for descriptions
- [ ] Colors match Anthropic palette
- [ ] Mobile: rows tappable, table scrollable

---

## Reference Files

| File | What it is | Read it for |
|------|-----------|-------------|
| `mece-explorer/SKILL.md` | Behavioral spec | UX flow, system prompt, data model, API format, key behaviors |
| `mece-explorer/references/brand-and-layout.md` | Visual spec | Every hex code, font size, row dimension, tooltip spec, animation |
| `mece-explorer.jsx` | Working prototype | Reference implementation — all logic works, copy patterns from here |
