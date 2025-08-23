import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Upload, User, Sparkles, Palette, Zap, Wallet, Check, AlertTriangle, X } from 'lucide-react';
import ProfessionalStadiumCanvas from "@/components/stadium/ProfessionalStadiumCanvas";
import { BatchMintDialog } from '@/components/ui/batch-mint-dialog';

export type StadiumMobileLayoutProps = {
  availableStadiums: any[];
  selectedStadium: string;
  setSelectedStadium: (v: string) => void;
  generationStyle: string;
  setGenerationStyle: (v: string) => void;
  perspective: string;
  setPerspective: (v: string) => void;
  atmosphere: string;
  setAtmosphere: (v: string) => void;
  timeOfDay: string;
  setTimeOfDay: (v: string) => void;
  weather: string;
  setWeather: (v: string) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  isVisionMode: boolean;
  referenceImage: string | null;
  selectedSport: string;
  setSelectedSport: (v: string) => void;
  selectedView: string;
  setSelectedView: (v: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearReference: () => void;
  generationCost: number | null;
  error: string | null;
  onResetError: () => void;
  generatedImage: string;
  isLoading: boolean;
  onGenerate: () => void;
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
  onMintGasless: () => void;
  walletAddress: string;
  nftName: string;
  hasGeneratedImage: boolean;
  metadataUri: string;
  collection: 'stadiums';
};

export default function StadiumMobileLayout({
  availableStadiums,
  selectedStadium,
  setSelectedStadium,
  generationStyle,
  setGenerationStyle,
  perspective,
  setPerspective,
  atmosphere,
  setAtmosphere,
  timeOfDay,
  setTimeOfDay,
  weather,
  setWeather,
  customPrompt,
  setCustomPrompt,
  isVisionMode,
  referenceImage,
  selectedSport,
  setSelectedSport,
  selectedView,
  setSelectedView,
  onFileUpload,
  onClearReference,
  generationCost,
  error,
  onResetError,
  generatedImage,
  isLoading,
  onGenerate,
  isConnected,
  isOnSupportedChain,
  isUserAdmin,
  canMintGasless,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash,
  onMintGasless,
  walletAddress,
  nftName,
  hasGeneratedImage,
  metadataUri,
  collection,
}: StadiumMobileLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-2 py-4">
      {/* Canvas/Preview */}
      <div className="w-full max-w-sm aspect-square mx-auto mb-6">
        <ProfessionalStadiumCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={onResetError}
          selectedStadium={selectedStadium}
          generationStyle={generationStyle}
          perspective={perspective}
          atmosphere={atmosphere}
          timeOfDay={timeOfDay}
          weather={weather}
          customPrompt={customPrompt}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
          isAnalyzing={false}
          availableStadiums={availableStadiums}
        />
      </div>

      {/* Feedbacks de erro/sucesso/wallet */}
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

      {!isOnSupportedChain && isConnected && (
        <div className="w-full max-w-sm mb-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 text-sm">Switch to CHZ Mainnet</span>
        </div>
      )}

      {/* Formulário Mobile */}
      <div className="flex flex-col gap-3 text-sm w-full max-w-sm">
        {/* Stadium Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <User className="w-4 h-4 opacity-70" /> Stadium
          </div>
          <Select value={selectedStadium} onValueChange={setSelectedStadium}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Stadium" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              {availableStadiums.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Style Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Style
          </div>
          <Select value={generationStyle} onValueChange={setGenerationStyle}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Style" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="realistic">Realistic</SelectItem>
              <SelectItem value="futuristic">Futuristic</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimalist">Minimalist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Perspective Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Perspective
          </div>
          <Select value={perspective} onValueChange={setPerspective}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Perspective" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="aerial">Aerial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Atmosphere Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Atmosphere
          </div>
          <Select value={atmosphere} onValueChange={setAtmosphere}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Atmosphere" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="empty">Empty</SelectItem>
              <SelectItem value="half-full">Half-full</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Time of Day Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Time of Day
          </div>
          <Select value={timeOfDay} onValueChange={setTimeOfDay}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Time of Day" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="night">Night</SelectItem>
              <SelectItem value="sunset">Sunset</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Weather Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Weather
          </div>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Weather" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="rainy">Rainy</SelectItem>
              <SelectItem value="cloudy">Cloudy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Botão de Gerar - só aparece se NÃO houver imagem gerada */}
        {!generatedImage && (
          <div className="mt-2 flex justify-center">
            <Button
              className="group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed bg-white !text-black hover:bg-[#FF0052] hover:!text-white w-full"
              onClick={onGenerate}
              disabled={isLoading || !selectedStadium}
            >
              <div className="flex items-center gap-3 max-lg:gap-2">
                <Zap className="w-6 h-6 fill-[#FF0052] stroke-[#FF0052] group-hover:fill-white group-hover:stroke-white max-lg:w-4 max-lg:h-4" />
                <span>{isLoading ? 'Generating...' : 'Generate Stadium'}</span>
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
        {/* Custom Prompt */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Sparkles className="w-4 h-4 opacity-70" /> Custom Prompt
          </div>
          <Input
            type="text"
            placeholder="Enter prompt..."
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            className="text-white bg-white/5 border-white/10 font-semibold py-3 rounded-lg"
          />
        </div>
      </div>
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
            {/* Batch Mint para admin, igual ao desktop */}
            {walletAddress && nftName && hasGeneratedImage && (
              <BatchMintDialog
                trigger={
                  <Button
                    disabled={!isConnected || isMinting}
                    variant="outline"
                    className="w-full h-12 px-6 text-base font-medium bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20 disabled:opacity-50"
                  >
                    Mint
                  </Button>
                }
                to={walletAddress}
                metadataUri={metadataUri}
                nftName={nftName}
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
                {mintStatus === 'success' && <span>Stadium NFT minted successfully!</span>}
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
  );
} 