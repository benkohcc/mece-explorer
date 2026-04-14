'use client'

import { useState } from 'react'

export default function Tooltip({
  text,
  children,
}: {
  text: string | null
  children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.top })
        setShow(true)
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <span
          className="tooltip-in"
          style={{
            position: 'fixed',
            left: Math.min(pos.x, typeof window !== 'undefined' ? window.innerWidth - 260 : 500),
            top: pos.y - 8,
            transform: 'translateX(-50%) translateY(-100%)',
            background: '#141413',
            color: '#e8e6dc',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
            maxWidth: 280,
            width: 'max-content',
            fontFamily: 'var(--font-lora), Georgia, serif',
            fontWeight: 400,
            boxShadow: '0 4px 16px rgba(20,20,19,0.2)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: '#141413',
            }}
          />
        </span>
      )}
    </span>
  )
}
