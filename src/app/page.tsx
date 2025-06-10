'use client';

import dynamic from 'next/dynamic'

const JerseyEditor = dynamic(() => import('@/components/JerseyEditor'), {
  ssr: false
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Gerador de Camisas de Futebol com IA
        </h1>
        <JerseyEditor />
      </div>
    </main>
  );
}
