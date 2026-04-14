---
name: mece-explorer
description: >
  Generates an AI-powered interactive MECE decomposition tool as a React artifact.
  The artifact calls the Anthropic API ("Claude in Claude") to break any topic into
  mutually exclusive, collectively exhaustive categories displayed as an expandable
  tree. Users click [+] to decompose categories deeper. The LLM signals confidence
  and marks terminal leaves. Use this skill whenever someone asks to brainstorm,
  break down, decompose, structure, or do a MECE analysis of any topic. Also trigger
  for "issue tree", "logic tree", "framework breakdown", "structured thinking",
  "problem decomposition", or "hypothesis tree". Even if the user just says
  "help me think through X" or "break this down for me" — use this skill.
---

# MECE Explorer Skill

Generate a **single self-contained React (.jsx) artifact** that implements an interactive MECE decomposition tool. The artifact calls the Anthropic API directly from the browser (the Claude-in-Claude pattern supported in Claude.ai artifacts).

## User Experience Flow

```
1. App loads → start screen with topic input field + example chips
2. User types a topic, presses "Decompose" (or Enter)
3. App calls Claude API → returns 3-6 MECE categories with confidence metadata
4. Categories render as an indented tree:
   - Title visible by default (bold, Poppins)
   - Description shown on HOVER as a dark tooltip (Lora serif)
   - [+] button on the left to expand deeper
5. User clicks [+] → app calls Claude again → child rows appear indented
   - [+] becomes [−] to collapse/expand (no re-fetch)
6. If confidence is "medium" or "low":
   - Colored banner appears below the parent row
   - Yellow for medium, orange for low
   - Shows the reason, dismissible with ×
7. Categories marked decomposable:false show a leaf dot (no [+] button)
   - "LEAF" badge next to label
8. Unlimited depth. LLM self-regulates via confidence + decomposable flags
9. "New" button resets to start screen
```

## Architecture: Single React Artifact

The output MUST be a single `.jsx` file with a default export. No separate files, no imports beyond React and standard hooks. The artifact uses `fetch("https://api.anthropic.com/v1/messages", ...)` — no API key needed (handled by the artifact sandbox).

### Component Tree

```
MECEExplorer (default export)
├── StartScreen (inline, conditional render when !started)
│   ├── AnthropicMark (SVG logo)
│   ├── Topic input + Decompose button
│   └── Example chips
└── TreeView (inline, conditional render when started)
    ├── AppHeader (sticky, with "New" button + stats)
    ├── ErrorBanner (conditional)
    └── <table>
        └── TreeRow (recursive)
            ├── PlusMinusButton | LeafDot
            ├── ColorBar
            ├── Label with Tooltip
            ├── LEAF badge (conditional)
            ├── LoadingDots (conditional)
            └── ConfidenceBanner (conditional sub-row)
                └── Children TreeRows (recursive)
```

All components are defined inline in the same file. No separate component files.

## System Prompt for API Calls

The artifact must use this exact system prompt when calling the Anthropic API:

```
You are a MECE (Mutually Exclusive, Collectively Exhaustive) decomposition expert.

When given a topic, break it into MECE categories. Each category must be:
- Mutually Exclusive: No overlaps between categories
- Collectively Exhaustive: Together they cover the entire topic

IMPORTANT: Evaluate whether this topic CAN be meaningfully decomposed further. If the topic is:
- Too atomic/granular to split further
- A concrete action item rather than a category
- Something where sub-categories would be forced or overlapping
Then set "decomposable" to false.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "confidence": "high" | "medium" | "low",
  "confidence_reason": "Brief reason if medium/low",
  "categories": [
    {
      "name": "Short Name",
      "description": "One sentence description",
      "decomposable": true
    }
  ]
}

Rules:
- 3-6 categories per decomposition
- Names: 2-4 words max
- Descriptions: one concise sentence
- confidence: "high" = clean MECE split, "medium" = reasonable but some overlap possible,
  "low" = topic too granular or categories are forced
- Set decomposable: false on categories that are too atomic to split further
```

### API Call Format

```javascript
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  }),
});
```

### Prompt Construction

- **Root decomposition:** `Break down this topic into MECE categories: "${topic}"`
- **Deeper levels:** `We are doing a MECE decomposition. Full path: ${path.join(" → ")}. Now break down "${node.label}" into MECE sub-categories within the context of the root topic "${path[0]}".`

The `path` array is built by walking up `parentId` links from the clicked node to root.

### Response Parsing

```javascript
const data = await res.json();
const text = data.content?.map(b => b.text || "").join("") || "";
const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
```

## Visual Design: Anthropic Brand

Read `references/brand-and-layout.md` for the complete color palette, typography, component specs, and row dimensions. The key points:

- **Background:** `#faf9f5` (warm parchment) with subtle dot grid
- **Primary accent:** `#d97757` (Anthropic orange) for CTAs, root depth color
- **Typography:** Poppins for all UI chrome, Lora for descriptions/tooltips
- **Depth colors cycle:** orange → blue → green → purple → gold → teal
- **Tooltips:** dark bg `#141413`, Lora serif, positioned above label on hover

## Data Model

```typescript
// Each node in the tree
interface MECENode {
  id: string;              // "root", "root-0", "root-0-2"
  label: string;           // 2-4 word name
  description: string;     // one sentence, shown on hover
  depth: number;           // 0 = root
  parentId: string | null;
  decomposable: boolean;   // false = leaf, no [+] button
}

// State
nodes: MECENode[]
expanded: Set<string>      // nodeIds currently showing children
loading: string | null     // nodeId being fetched
notifications: Record<string, { confidence: string, reason: string }>
```

## Key Behaviors

1. **[+] button** appears on every row where `decomposable !== false` AND node has no children yet. Clicking it calls the API and inserts children.
2. **[−] button** replaces [+] after children exist. Toggles visibility only — no re-fetch.
3. **Leaf indicator** (small colored dot + "LEAF" badge) shown when `decomposable === false`.
4. **Loading dots** (3 animated circles) replace the [+] button during API calls.
5. **Tooltip** on hover: dark background, Lora text, max-width 280px, arrow pointing down. Only shows if description exists and isn't "Root topic".
6. **Confidence banner** renders as a full-width sub-row below the parent when confidence !== "high". Yellow for medium, orange for low. Dismissible.
7. **Row hover:** background shifts to `#f3f0e8`, label gets dashed underline hint.
8. **Stats** in sticky header: node count, max depth.
