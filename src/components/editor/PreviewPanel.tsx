import React from 'react';
import Image from 'next/image';
import { Palette } from 'lucide-react';

interface PreviewPanelProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function PreviewPanel({ generatedImage, isLoading, error }: PreviewPanelProps) {
  return (
    <div className="lg:col-span-1 flex flex-col items-center justify-center bg-gray-900/50 p-6 rounded-2xl border border-secondary/10 shadow-lg relative overflow-hidden h-full">
      <div className="w-full h-96 flex items-center justify-center relative">
        {isLoading ? (
          <div className="text-center text-gray-500 animate-pulse">
            <Palette size={48} className="mx-auto mb-2" />
            Generating your creation...
          </div>
        ) : generatedImage ? (
          <Image src={generatedImage} alt="Generated Preview" layout="fill" objectFit="contain" className="rounded-lg" />
        ) : (
          <div className="text-center text-gray-500">
            <Palette size={48} className="mx-auto mb-2" />
            Your generated image will appear here.
          </div>
        )}
      </div>
      {error && !isLoading && (
        <div className="mt-4 text-red-500 text-center text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
} 