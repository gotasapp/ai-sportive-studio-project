'use client';

import dynamic from 'next/dynamic'

const JerseyEditor = dynamic(() => import('@/components/JerseyEditor'), {
  ssr: false,
<<<<<<< HEAD
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
=======
  loading: () => <p>Loading...</p>
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          AI Football Jersey Generator
        </h1>
        <JerseyEditor />
      </div>
    </main>
  );
>>>>>>> 494d2538ca996862767808e81399901fc4b31e1b
}
