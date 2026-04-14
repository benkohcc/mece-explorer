'use client'

import { useState } from 'react'
import { useTreeStore } from '@/store/useTreeStore'
import AnthropicMark from './ui/AnthropicMark'

const EXAMPLES = ['Product Strategy', 'Climate Change', 'AI Risk', 'Supply Chain']

export default function StartScreen() {
  const [topic, setTopic] = useState('Tennis Rackets')
  const initRoot = useTreeStore(s => s.initRoot)

  const start = () => {
    const t = topic.trim()
    if (!t) return
    initRoot(t)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#faf9f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-poppins), Arial, sans-serif',
        padding: 24,
      }}
    >
      <div className="bg-dotgrid" style={{ position: 'fixed', inset: 0, opacity: 0.35 }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 500 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            background: '#fffefa',
            padding: '8px 16px',
            borderRadius: 24,
            border: '1px solid #e0ddd3',
            boxShadow: '0 1px 3px rgba(20,20,19,0.04)',
          }}
        >
          <AnthropicMark size={18} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#5a584f',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Structured Thinking
          </span>
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#141413',
            lineHeight: 1.1,
            marginBottom: 14,
            letterSpacing: '-0.02em',
          }}
        >
          MECE Explorer
        </h1>
        <p
          style={{
            fontSize: 16,
            color: '#5a584f',
            lineHeight: 1.65,
            marginBottom: 36,
            fontFamily: 'var(--font-lora), Georgia, serif',
            maxWidth: 400,
            margin: '0 auto 36px',
          }}
        >
          Enter any topic and get a structured, mutually exclusive &amp; collectively exhaustive
          breakdown. Expand categories to dig deeper.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && start()}
            placeholder="e.g. Product Strategy, Climate Change..."
            style={{
              flex: 1,
              padding: '15px 20px',
              fontSize: 15,
              background: '#fffefa',
              border: '1px solid #e0ddd3',
              borderRadius: 12,
              color: '#1a1a19',
              outline: 'none',
              fontFamily: 'var(--font-lora), Georgia, serif',
              boxShadow: '0 1px 3px rgba(20,20,19,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#d97757'
              e.target.style.boxShadow = '0 0 0 3px #d9775718'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0ddd3'
              e.target.style.boxShadow = '0 1px 3px rgba(20,20,19,0.04)'
            }}
          />
          <button
            onClick={start}
            disabled={!topic.trim()}
            style={{
              padding: '15px 28px',
              fontSize: 14,
              fontWeight: 600,
              background: '#d97757',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              opacity: topic.trim() ? 1 : 0.4,
              fontFamily: 'var(--font-poppins), Arial, sans-serif',
              boxShadow: '0 2px 8px #d9775733',
              transition: 'background 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              if (topic.trim()) {
                e.currentTarget.style.background = '#c4634a'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#d97757'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Decompose
          </button>
        </div>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setTopic(ex)}
              style={{
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 500,
                background: '#f7f5ee',
                border: '1px solid #e0ddd3',
                borderRadius: 20,
                color: '#5a584f',
                cursor: 'pointer',
                fontFamily: 'var(--font-poppins), Arial, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d97757'
                e.currentTarget.style.color = '#1a1a19'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0ddd3'
                e.currentTarget.style.color = '#5a584f'
              }}
            >
              {ex}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
