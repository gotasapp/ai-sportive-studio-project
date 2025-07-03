import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionPanelProps {
  title: string;
  isMinting: boolean;
  isUploading: boolean;
  canMint: boolean;
  canUpload: boolean;
  isUserAdmin: boolean;
  mintSuccess?: string | null;
  mintError?: string | null;
  uploadSuccess?: string | null;
  uploadError?: string | null;
  onMint: () => void;
  onUpload: () => void;
}

export default function ActionPanel({
  title,
  isMinting,
  isUploading,
  canMint,
  canUpload,
  isUserAdmin,
  mintSuccess,
  mintError,
  uploadSuccess,
  uploadError,
  onMint,
  onUpload,
}: ActionPanelProps) {
  return (
    <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-2xl border border-secondary/10 shadow-lg h-full">
      <h2 className="text-2xl font-bold mb-6 text-secondary">{title}</h2>
      
      {/* Seção de Mint */}
      <div className="space-y-4">
        <Button 
          onClick={onMint} 
          disabled={isMinting || !canMint} 
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg text-lg transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          {isMinting ? 'Minting...' : (isUserAdmin ? 'Mint Gasless (Admin)' : 'Mint NFT')}
        </Button>
        {mintSuccess && <div className="text-green-400 text-center text-sm p-2 bg-green-900/50 rounded-md">{mintSuccess}</div>}
        {mintError && <div className="text-red-400 text-center text-sm p-2 bg-red-900/50 rounded-md">{mintError}</div>}
      </div>

      {/* Seção IPFS */}
      <div className="mt-6 pt-6 border-t border-secondary/10">
        <Button 
          onClick={onUpload} 
          disabled={isUploading || !canUpload} 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading to IPFS...' : 'Upload to IPFS'}
        </Button>
        {uploadSuccess && <div className="mt-2 text-xs text-blue-400 truncate">{uploadSuccess}</div>}
        {uploadError && <div className="mt-2 text-red-500 text-xs">{uploadError}</div>}
      </div>
    </div>
  );
} 