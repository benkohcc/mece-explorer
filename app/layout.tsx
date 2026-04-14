import type { Metadata } from 'next'
import { Poppins, Lora } from 'next/font/google'
import '../styles/globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'MECE Explorer',
  description: 'Interactive MECE decomposition powered by Claude',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${lora.variable}`}>
      <body style={{ background: '#faf9f5', margin: 0 }}>{children}</body>
    </html>
  )
}
