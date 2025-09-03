import React from 'react';
import Image from 'next/image';
import { Upload, Palette } from 'lucide-react';

interface PreviewPanelProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
}

export default function PreviewPanel({ generatedImage, isLoading, error, onResetError }: PreviewPanelProps) {
  return (
    <div className="flex justify-center h-[80vh]">
      <div className="relative w-[60vh] h-[75vh] rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #050505 0%, #0E0D0D 50%, #191919 100%)',
        border: '2px solid rgba(156, 163, 175, 0.3)'
      }}>
        
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="text-cyan-400 text-2xl font-semibold">Generating...</p>
            <div className="mt-6 w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
                <span className="text-red-400 text-4xl">⚠</span>
              </div>
              <p className="text-red-400 mb-8 text-center text-xl">{error}</p>
              <button 
                onClick={onResetError}
                className="px-8 py-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-lg"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        
        {generatedImage && !isLoading && !error && (
          <div className="absolute inset-0 p-6 lg:p-3">
            <Image src={generatedImage} alt="Generated Preview" layout="fill" objectFit="contain" className="rounded-lg" />
            <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
            <div className="absolute -top-3 lg:top-1 -right-3 lg:right-1 w-8 lg:w-6 h-8 lg:h-6 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          </div>
        )}
        
        {!generatedImage && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-4">
            <div className="text-center">
              <div className="w-40 lg:w-32 h-48 lg:h-40 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 lg:mb-4 mx-auto">
                <div className="text-center">
                  <Palette className="w-12 lg:w-8 h-12 lg:h-8 text-cyan-400/50 mx-auto mb-3 lg:mb-2" />
                  <p className="text-sm lg:text-xs text-gray-400">Preview</p>
                </div>
              </div>
              <p className="text-gray-400 text-lg lg:text-sm">Your generated image will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 