export default function LoadingDots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: color,
            animation: `dotPulse 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  )
}
