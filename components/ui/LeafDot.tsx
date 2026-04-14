export default function LeafDot({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2.5" fill={color} opacity="0.35" />
    </svg>
  )
}
