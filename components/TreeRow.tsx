'use client'

import { useState } from 'react'
import { MECENode, depthColor } from '@/lib/types'
import { useTreeStore } from '@/store/useTreeStore'
import ConfidenceBanner from './ConfidenceBanner'
import PlusMinusButton from './ui/PlusMinusButton'
import LeafDot from './ui/LeafDot'
import LoadingDots from './ui/LoadingDots'
import LeafBadge from './ui/LeafBadge'

export default function TreeRow({ node }: { node: MECENode }) {
  const expandedIds = useTreeStore(s => s.expandedIds)
  const loadingId = useTreeStore(s => s.loadingId)
  const notifications = useTreeStore(s => s.notifications)
  const toggleExpanded = useTreeStore(s => s.toggleExpanded)
  const expandNode = useTreeStore(s => s.expandNode)
  const dismissNotification = useTreeStore(s => s.dismissNotification)
  const selectNode = useTreeStore(s => s.selectNode)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const children = useTreeStore(s => s.nodes.filter(n => n.parentId === node.id))

  const [hovered, setHovered] = useState(false)

  const depth = node.depth
  const color = depthColor(depth)
  const isExpanded = expandedIds.has(node.id)
  const isLoading = loadingId === node.id
  const hasChildren = children.length > 0
  const canDecompose = node.decomposable !== false
  const isTerminal = !canDecompose && !hasChildren
  const notification = notifications[node.id]

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#f3f0e8' : 'transparent',
          transition: 'background 0.12s ease',
        }}
      >
        <td
          style={{
            padding: 0,
            borderBottom: '1px solid #e0ddd3',
            fontFamily: 'var(--font-poppins), Arial, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              paddingLeft: depth * 28 + 16,
              paddingTop: 10,
              paddingBottom: 10,
              minHeight: 44,
            }}
          >
            <span
              style={{
                width: 28,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isLoading ? (
                <LoadingDots color={color} />
              ) : hasChildren ? (
                <PlusMinusButton
                  color={color}
                  expanded={isExpanded}
                  hasChildren
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpanded(node.id)
                  }}
                />
              ) : canDecompose ? (
                <PlusMinusButton
                  color={color}
                  expanded={false}
                  hasChildren={false}
                  hovered={hovered}
                  onClick={(e) => {
                    e.stopPropagation()
                    expandNode(node)
                  }}
                />
              ) : (
                <LeafDot color={color} />
              )}
            </span>

            <span
              style={{
                width: 3,
                height: 20,
                borderRadius: 2,
                background: color,
                opacity: depth === 0 ? 1 : 0.45,
                flexShrink: 0,
                marginRight: 10,
                marginLeft: 6,
                marginTop: 1,
              }}
            />

            {(() => {
              const clickable = depth > 0
              const isSelected = selectedNodeId === node.id
              return (
                <div
                  onClick={clickable ? () => selectNode(node) : undefined}
                  title={clickable ? 'Click for detailed explanation' : undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    flex: 1,
                    cursor: clickable ? 'pointer' : 'default',
                    padding: clickable ? '2px 8px' : 0,
                    marginLeft: clickable ? -8 : 0,
                    borderRadius: 6,
                    background: isSelected ? `${color}14` : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: depth === 0 ? 15 : 14,
                        fontWeight: depth === 0 ? 700 : 600,
                        color: isTerminal ? '#5a584f' : '#1a1a19',
                        lineHeight: 1.3,
                        borderBottom:
                          clickable && hovered
                            ? '1px dashed #b0aea5'
                            : '1px dashed transparent',
                        transition: 'border-color 0.15s',
                        paddingBottom: 1,
                      }}
                    >
                      {node.label}
                    </span>
                    {isTerminal && <LeafBadge />}
                  </div>
                  {node.description && node.description !== 'Root topic' && (
                    <span
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: '#5a584f',
                        fontFamily: 'var(--font-lora), Georgia, serif',
                      }}
                    >
                      {node.description}
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        </td>
      </tr>

      {notification && isExpanded && (
        <tr>
          <td style={{ padding: 0, borderBottom: '1px solid #e0ddd3' }}>
            <ConfidenceBanner
              confidence={notification.confidence}
              reason={notification.reason}
              onDismiss={() => dismissNotification(node.id)}
            />
          </td>
        </tr>
      )}

      {isExpanded && children.map(child => <TreeRow key={child.id} node={child} />)}
    </>
  )
}
