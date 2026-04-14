'use client'

interface Props {
  color: string
  expanded: boolean
  onClick: (e: React.MouseEvent) => void
  hovered?: boolean
  hasChildren: boolean
}

function PlusIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3.5V12.5M3.5 8H12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function MinusIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8H12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function PlusMinusButton({
  color,
  expanded,
  onClick,
  hovered = false,
  hasChildren,
}: Props) {
  const borderColor = hasChildren ? `${color}40` : '#e0ddd3'
  const bg = hasChildren
    ? expanded
      ? `${color}12`
      : 'transparent'
    : hovered
      ? `${color}08`
      : 'transparent'

  return (
    <button
      onClick={onClick}
      title={hasChildren ? (expanded ? 'Collapse' : 'Expand') : 'Decompose this category'}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `1px solid ${borderColor}`,
        background: bg,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        opacity: hasChildren ? 1 : hovered ? 1 : 0.5,
      }}
    >
      {expanded ? <MinusIcon color={color} /> : <PlusIcon color={color} />}
    </button>
  )
}
