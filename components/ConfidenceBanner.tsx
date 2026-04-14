'use client'

interface Props {
  confidence: 'medium' | 'low'
  reason: string
  onDismiss: () => void
}

export default function ConfidenceBanner({ confidence, reason, onDismiss }: Props) {
  const isLow = confidence === 'low'
  return (
    <div
      className="slide-down"
      style={{
        padding: '8px 16px 8px 44px',
        background: isLow ? '#fef2ee' : '#fdf8ee',
        borderBottom: `1px solid ${isLow ? '#d9775733' : '#d4a25933'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: isLow ? '#d97757' : '#9a7b2e',
        fontFamily: 'var(--font-lora), Georgia, serif',
        fontStyle: 'italic',
      }}
    >
      <span
        style={{
          fontWeight: 600,
          fontStyle: 'normal',
          fontFamily: 'var(--font-poppins), Arial, sans-serif',
        }}
      >
        {isLow ? '⚠ Low confidence' : '◐ Medium confidence'}
      </span>
      <span style={{ color: isLow ? '#c4634a' : '#8a6d24' }}>—</span>
      <span>{reason}</span>
      <button
        onClick={onDismiss}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isLow ? '#d97757' : '#9a7b2e',
          fontSize: 14,
          padding: '0 4px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
