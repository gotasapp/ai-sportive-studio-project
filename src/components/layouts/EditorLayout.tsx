import React from 'react';

interface EditorLayoutProps {
  controls: React.ReactNode;
  preview: React.ReactNode;
  marketplace: React.ReactNode;
}

export default function EditorLayout({ controls, preview, marketplace }: EditorLayoutProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna de Controles (Painel Esquerdo) */}
        <div className="lg:col-span-1 space-y-6">
          {controls}
        </div>

        {/* Coluna de Preview e Marketplace (Centro e Direita) */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-4">
          <div>
            <div className="p-8 lg:p-4">
              {preview}
              {marketplace}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 