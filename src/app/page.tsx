'use client';

import dynamic from 'next/dynamic'

const JerseyEditor = dynamic(() => import('@/components/JerseyEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-cyan-400 text-lg">Loading AI Sports NFT...</p>
      </div>
    </div>
  )
})

export default function Home() {
  return <JerseyEditor />;
}
