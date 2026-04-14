'use client'

import { useEffect, useMemo } from 'react'
import { useTreeStore } from '@/store/useTreeStore'
import { depthColor } from '@/lib/types'
import LoadingDots from './ui/LoadingDots'

export default function DetailPanel() {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId)
  const nodes = useTreeStore((s) => s.nodes)
  const explanations = useTreeStore((s) => s.explanations)
  const loading = useTreeStore((s) => s.explanationLoading)
  const error = useTreeStore((s) => s.explanationError)
  const getPath = useTreeStore((s) => s.getPath)
  const closePanel = useTreeStore((s) => s.closePanel)
  const selectNode = useTreeStore((s) => s.selectNode)

  const node = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null),
    [selectedNodeId, nodes]
  )

  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [node, closePanel])

  if (!node) return null

  const color = depthColor(node.depth)
  const path = getPath(node)
  const explanation = explanations[node.id]

  return (
    <>
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 92vw)',
          background: '#fffefa',
          borderLeft: '1px solid #e0ddd3',
          boxShadow: '-8px 0 24px rgba(20,20,19,0.08)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'panelIn 0.2s ease',
        }}
      >
        <div
          style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid #e0ddd3',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span
            style={{
              width: 3,
              minHeight: 24,
              borderRadius: 2,
              background: color,
              flexShrink: 0,
              marginTop: 4,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8a877d',
                marginBottom: 6,
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
                wordBreak: 'break-word',
              }}
            >
              {path.slice(0, -1).join(' › ') || 'Root'}
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#1a1a19',
                margin: 0,
                lineHeight: 1.25,
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
              }}
            >
              {node.label}
            </h3>
            {node.description && node.description !== 'Root topic' && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#5a584f',
                  fontFamily: 'var(--font-lora), Georgia, serif',
                }}
              >
                {node.description}
              </p>
            )}
          </div>
          <button
            onClick={closePanel}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid #e0ddd3',
              background: '#f7f5ee',
              cursor: 'pointer',
              color: '#5a584f',
              fontSize: 16,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px 32px',
          }}
        >
          {loading && !explanation && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#8a877d',
                fontFamily: 'var(--font-lora), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 13,
              }}
            >
              <LoadingDots color={color} />
              <span>Thinking through this one…</span>
            </div>
          )}

          {error && !explanation && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2ee',
                border: '1px solid #d9775733',
                color: '#d97757',
                fontSize: 13,
                fontFamily: 'var(--font-lora), Georgia, serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>{error}</span>
              <button
                onClick={() => selectNode(node)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#d97757',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Arial, sans-serif',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {explanation && <Markdown text={explanation} />}
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(20px) }
          to { opacity: 1; transform: translateX(0) }
        }
      `}</style>
    </>
  )
}

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdown(text), [text])
  return (
    <div
      style={{
        fontFamily: 'var(--font-lora), Georgia, serif',
        fontSize: 14,
        lineHeight: 1.7,
        color: '#1a1a19',
      }}
    >
      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          return (
            <h4
              key={i}
              style={{
                marginTop: i === 0 ? 0 : 20,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#5a584f',
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
              }}
            >
              {block.content}
            </h4>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul
              key={i}
              style={{
                margin: '0 0 12px 0',
                paddingLeft: 20,
              }}
            >
              {block.items.map((it, j) => (
                <li key={j} style={{ marginBottom: 6 }}>
                  {renderInline(it)}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{ margin: '0 0 12px 0' }}>
            {renderInline(block.content)}
          </p>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'h2'; content: string }
  | { type: 'p'; content: string }
  | { type: 'ul'; items: string[] }

function parseMarkdown(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let buf: string[] = []
  let list: string[] | null = null

  const flushPara = () => {
    if (buf.length) {
      blocks.push({ type: 'p', content: buf.join(' ').trim() })
      buf = []
    }
  }
  const flushList = () => {
    if (list && list.length) blocks.push({ type: 'ul', items: list })
    list = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushPara()
      flushList()
      continue
    }
    if (line.startsWith('## ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h2', content: line.slice(3).trim() })
      continue
    }
    if (line.startsWith('# ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h2', content: line.slice(2).trim() })
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushPara()
      if (!list) list = []
      list.push(line.slice(2).trim())
      continue
    }
    flushList()
    buf.push(line)
  }
  flushPara()
  flushList()
  return blocks
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key++} style={{ fontWeight: 600 }}>
          {match[1]}
        </strong>
      )
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>)
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          style={{
            background: '#f3f0e8',
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: '0.9em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {match[3]}
        </code>
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
