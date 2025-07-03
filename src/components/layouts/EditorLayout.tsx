import React from 'react';

interface EditorLayoutProps {
  controls: React.ReactNode;
  preview: React.ReactNode;
  actions: React.ReactNode;
  marketplace: React.ReactNode;
}

export default function EditorLayout({ controls, preview, actions, marketplace }: EditorLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna 1: Controles de Geração */}
          <div className="lg:col-span-1">
            {controls}
          </div>

          {/* Coluna 2: Preview da Imagem */}
          <div className="lg:col-span-1">
            {preview}
          </div>

          {/* Coluna 3: Mint e Opções */}
          <div className="lg:col-span-1">
            {actions}
          </div>
        </div>
        
        {/* Seção Marketplace */}
        <div className="mt-12">
          {marketplace}
        </div>
      </main>
    </div>
  );
} 