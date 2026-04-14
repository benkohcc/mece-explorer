'use client'

import { useTreeStore } from '@/store/useTreeStore'
import StartScreen from '@/components/StartScreen'
import TreeView from '@/components/TreeView'

export default function Home() {
  const nodes = useTreeStore(s => s.nodes)
  const started = nodes.length > 0

  return started ? <TreeView /> : <StartScreen />
}
