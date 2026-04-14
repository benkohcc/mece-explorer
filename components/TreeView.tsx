'use client'

import { useTreeStore } from '@/store/useTreeStore'
import AnthropicMark from './ui/AnthropicMark'
import TreeRow from './TreeRow'
import DetailPanel from './DetailPanel'

export default function TreeView() {
  const topic = useTreeStore(s => s.topic)
  const nodes = useTreeStore(s => s.nodes)
  const error = useTreeStore(s => s.error)
  const reset = useTreeStore(s => s.reset)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)

  const rootNodes = nodes.filter(n => n.parentId === null)
  const nodeCount = nodes.length
  const depthMax = nodes.reduce((m, n) => Math.max(m, n.depth), 0)

  const panelOpen = selectedNodeId !== null

  return (
    <div
      className={`tree-shell${panelOpen ? ' panel-open' : ''}`}
      style={{
        minHeight: '100vh',
        background: '#faf9f5',
        fontFamily: 'var(--font-poppins), Arial, sans-serif',
      }}
    >
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid #e0ddd3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fffefa',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={reset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: '#f7f5ee',
              border: '1px solid #e0ddd3',
              borderRadius: 8,
              color: '#5a584f',
              cursor: 'pointer',
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
            }}
          >
            <AnthropicMark size={14} /> New
          </button>
          <div style={{ height: 20, width: 1, background: '#e0ddd3' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a19', margin: 0 }}>
            {topic}
          </h2>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            color: '#8a877d',
            fontWeight: 500,
          }}
        >
          <span>{nodeCount} nodes</span>
          <span style={{ color: '#e0ddd3' }}>·</span>
          <span>{depthMax} deep</span>
          <span style={{ color: '#e0ddd3' }}>·</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#e8e6dc',
              color: '#5a584f',
            }}
          >
            hover for details
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            margin: '12px 24px 0',
            padding: '10px 18px',
            borderRadius: 10,
            background: '#fef2ee',
            border: '1px solid #d9775733',
            fontSize: 13,
            color: '#d97757',
            fontFamily: 'var(--font-lora), Georgia, serif',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ padding: '0 24px 48px', maxWidth: 720, margin: '0 auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
          <tbody>
            {rootNodes.map(node => (
              <TreeRow key={node.id} node={node} />
            ))}
          </tbody>
        </table>
      </div>
      <DetailPanel />
    </div>
  )
}
