'use client';

import dynamic from 'next/dynamic'

const JerseyEditor = dynamic(() => import('@/components/JerseyEditor'), {
  ssr: false
})

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 lg:p-12 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Football Jersey Generator
          </h1>
        </div>
        <div className="fixed bottom-0 right-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {/* ... (código do status da API) ... */}
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <JerseyEditor />
      </div>
    </main>
  );
}
