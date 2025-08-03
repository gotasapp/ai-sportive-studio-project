import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Upload, User, Sparkles, Palette, Zap, Wallet, Check, AlertTriangle, X } from 'lucide-react';
import ProfessionalCanvas from "@/components/editor/ProfessionalCanvas";
import { BatchMintDialog } from '@/components/ui/batch-mint-dialog';

const styles = ["Modern", "Retro", "Classic", "Urban", "National"];

export type JerseyMobileLayoutProps = {
  playerName: string;
  setPlayerName: (v: string) => void;
  playerNumber: string;
  setPlayerNumber: (v: string) => void;
  selectedTeam: string;
  setSelectedTeam: (v: string) => void;
  selectedStyle: string;
  setSelectedStyle: (v: string) => void;
  quality: "standard" | "hd";
  setQuality: (v: "standard" | "hd") => void;
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  referenceImage: string | null;
  isVisionMode: boolean;
  onGenerate: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  // Minting/Wallet/Status
  isConnected: boolean;
  isOnSupportedChain: boolean;
  isUserAdmin: boolean;
  canMintLegacy: boolean;
  canMintGasless: boolean;
  isMinting: boolean;
  mintStatus: 'idle' | 'pending' | 'success' | 'error';
  mintSuccess: string | null;
  mintError: string | null;
  transactionHash: string | null;
  onMintLegacy: () => void;
  onMintGasless: () => void;
  generationCost: number | null;
  availableTeams: string[];
  walletAddress: string | null;
  nftName: string | null;
  hasGeneratedImage: boolean;
  metadataUri: string | null;
  collection: 'jerseys' | 'stadiums' | 'badges';
  // ...outros props necessários
};

export default function JerseyMobileLayout({
  playerName,
  setPlayerName,
  playerNumber,
  setPlayerNumber,
  selectedTeam,
  setSelectedTeam,
  selectedStyle,
  setSelectedStyle,
  quality,
  setQuality,
  generatedImage,
  isLoading,
  error,
  onResetError,
  referenceImage,
  isVisionMode,
  onGenerate,
  onFileUpload,
  customPrompt,
  setCustomPrompt,
  isConnected,
  isOnSupportedChain,
  isUserAdmin,
  canMintLegacy,
  canMintGasless,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash,
  onMintLegacy,
  onMintGasless,
  generationCost,
  availableTeams,
  walletAddress,
  nftName,
  hasGeneratedImage,
  metadataUri,
  collection,
  // ...outros props
}: JerseyMobileLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-2 py-4">
      {/* Canvas/Preview */}
      <div className="w-full max-w-sm aspect-square mx-auto mb-6">
        <ProfessionalCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={onResetError}
          playerName={playerName}
          playerNumber={playerNumber}
          selectedTeam={selectedTeam}
          selectedStyle={selectedStyle}
          quality={quality}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
        />
      </div>

      {/* Feedback de erro/sucesso */}
      {error && (
        <div className="w-full max-w-sm mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
          <span className="text-red-400 text-sm flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={onResetError} className="text-red-400 p-1 h-auto"> <X className="h-4 w-4" /> </Button>
        </div>
      )}
      {mintSuccess && (
        <div className="w-full max-w-sm mb-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-400 text-sm">{mintSuccess}</span>
        </div>
      )}
      {mintError && (
        <div className="w-full max-w-sm mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">{mintError}</span>
        </div>
      )}

      {/* Feedback de conexão de wallet */}
      {!isConnected && (
        <div className="w-full max-w-sm mb-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2">
          <Wallet className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 text-sm">Connect your wallet to start generating and minting</span>
        </div>
      )}
      {!isOnSupportedChain && isConnected && (
        <div className="w-full max-w-sm mb-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 text-sm">Switch to a supported network</span>
        </div>
      )}

      {/* Formulário Mobile */}
      <div className="flex flex-col gap-3 text-sm w-full max-w-sm">
        {/* Team Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <User className="w-4 h-4 opacity-70" /> Team
          </div>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              {availableTeams.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Style
          </div>
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Style" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              {styles.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Name + Number */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="mb-1 ml-1 text-xs font-semibold text-white/80">Player</div>
            <Input
              type="text"
              placeholder="Player Name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-semibold py-3 rounded-lg"
            />
          </div>
          <div className="w-24">
            <div className="mb-1 ml-1 text-xs font-semibold text-white/80">Number</div>
            <Input
              type="number"
              placeholder="#"
              value={playerNumber}
              onChange={e => setPlayerNumber(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-semibold py-3 rounded-lg"
            />
          </div>
        </div>

        {/* Quality Select (opcional) */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Zap className="w-4 h-4 opacity-70" /> Quality
          </div>
          <Select value={quality} onValueChange={setQuality}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Quality" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="hd">HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão de Gerar - só aparece se NÃO houver imagem gerada */}
        {!generatedImage && (
          <div className="mt-2 flex justify-center">
            <Button
              className="group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed bg-white !text-black hover:bg-[#A20131] hover:!text-white w-full"
              onClick={onGenerate}
              disabled={isLoading || !selectedTeam || !playerName || !playerNumber}
            >
              <div className="flex items-center gap-3 max-lg:gap-2">
                <Zap className="w-6 h-6 fill-[#A20131] stroke-[#A20131] group-hover:fill-white group-hover:stroke-white max-lg:w-4 max-lg:h-4" />
                <span>{isLoading ? 'Generating...' : 'Generate Jersey'}</span>
              </div>
            </Button>
          </div>
        )}

        {/* Upload Image Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start px-4 py-3 bg-white/5 border-white/10 text-white">
              <Upload className="mr-2 w-4 h-4 opacity-70" /> Upload Image
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#1a1a2e] border-white/10">
            <Input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              className="text-white"
            />
          </PopoverContent>
        </Popover>

        {/* Custom Prompt Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start px-4 py-3 bg-white/5 border-white/10 text-white">
              <Sparkles className="mr-2 w-4 h-4 opacity-70" /> Custom Prompt
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-[#1a1a2e] border-white/10">
            <Input
              type="text"
              placeholder="Enter prompt..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              className="text-white"
            />
          </PopoverContent>
        </Popover>

        {/* Bloco de Mint - só aparece após imagem gerada */}
        {generatedImage && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {/* Gasless Mint - Somente para Admin */}
              {isUserAdmin && canMintGasless && (
                <Button
                  onClick={onMintGasless}
                  disabled={!canMintGasless || isMinting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Gasless</span>
                  </div>
                </Button>
              )}
              {/* Batch Mint para todos os usuários */}
              {walletAddress && nftName && hasGeneratedImage && (
                <BatchMintDialog
                  trigger={
                    <Button
                      disabled={!isConnected || isMinting}
                      variant="outline"
                      className="w-full h-12 px-6 text-base font-medium bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20 disabled:opacity-50"
                    >
                      Mint
                    </Button>
                  }
                  to={walletAddress}
                  metadataUri={metadataUri || ''}
                  nftName={nftName || ''}
                  collection={collection}
                  disabled={!isConnected || isMinting}
                  isUserAdmin={isUserAdmin}
                />
              )}
            </div>
            {/* Status de Mint */}
            {mintStatus !== 'idle' && (
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${mintStatus === 'success' ? 'text-green-400' : mintStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {mintStatus === 'pending' && <span>Minting in progress...</span>}
                  {mintStatus === 'success' && <span>NFT minted successfully!</span>}
                  {mintStatus === 'error' && <span>Mint failed</span>}
                </div>
                {transactionHash && (
                  <div className="text-xs text-blue-400 break-all">Tx: {transactionHash}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 