export default function AnthropicMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.5 2L22 22H17.2L14.7 16H9.3L13.5 2Z" fill="#d97757" />
      <path d="M10.5 2L2 22H6.8L9.3 16H14.7L10.5 2Z" fill="#d97757" opacity="0.6" />
    </svg>
  )
}
