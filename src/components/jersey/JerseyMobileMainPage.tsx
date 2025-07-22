import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Upload, User, Sparkles, Palette, Zap } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import ProfessionalCanvas from '@/components/editor/ProfessionalCanvas';

const teams = ["Fluminense", "Flamengo", "Palmeiras", "Vasco", "Corinthians", "São Paulo"];
const styles = ["Modern", "Retro", "Classic", "Urban", "National"];

type JerseyMobileMainPageProps = {
  onGoToAdvanced: () => void;
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  playerName: string;
  playerNumber: string;
  selectedTeam: string;
  selectedStyle: string;
  quality: "standard" | "hd" | undefined;
  referenceImage: string | null;
  isVisionMode: boolean;
};

export default function JerseyMobileMainPage({
  onGoToAdvanced,
  generatedImage,
  isLoading,
  error,
  onResetError,
  playerName,
  playerNumber,
  selectedTeam,
  selectedStyle,
  quality,
  referenceImage,
  isVisionMode
}: JerseyMobileMainPageProps) {
  const [team, setTeam] = useState(selectedTeam || 'Fluminense');
  const [style, setStyle] = useState(selectedStyle || 'Modern');
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-2 py-4">
      {/* Canvas ocupa o topo, com mesmo tamanho do preview antigo */}
      <div className="w-full max-w-sm aspect-square mx-auto mb-6">
        <ProfessionalCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={onResetError}
          playerName={playerName}
          playerNumber={playerNumber}
          selectedTeam={team}
          selectedStyle={style}
          quality={quality}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
        />
      </div>

      {/* Form Buttons/Inputs */}
      <div className="flex flex-col gap-3 text-sm w-full max-w-sm">
        {/* Team Header + Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <User className="w-4 h-4 opacity-70" /> Team
          </div>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white pr-8 py-3 rounded-lg font-semibold">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-48 overflow-y-auto">
              {teams.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Header + Select */}
        <div>
          <div className="mb-1 ml-1 text-xs font-semibold text-white/80 flex items-center gap-1">
            <Palette className="w-4 h-4 opacity-70" /> Style
          </div>
          <Select value={style} onValueChange={setStyle}>
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

        {/* Player Name + Number Inputs lado a lado */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="mb-1 ml-1 text-xs font-semibold text-white/80">Player</div>
            <Input
              type="text"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-semibold py-3 rounded-lg"
            />
          </div>
          <div className="w-24">
            <div className="mb-1 ml-1 text-xs font-semibold text-white/80">Number</div>
            <Input
              type="number"
              placeholder="#"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-semibold py-3 rounded-lg"
            />
          </div>
        </div>

        {/* Generate Button - estilo desktop */}
        <div className="mt-2 flex justify-center">
          <Button
            className="group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed bg-white !text-black hover:bg-[#A20131] hover:!text-white w-full"
          >
            <div className="flex items-center gap-3 max-lg:gap-2">
              <Zap className="w-6 h-6 fill-[#A20131] stroke-[#A20131] group-hover:fill-white group-hover:stroke-white max-lg:w-4 max-lg:h-4" />
              <span>Generate Jersey</span>
            </div>
          </Button>
        </div>

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
              onChange={(e) => setUploadedImage(e.target.files?.[0] || null)}
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
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="text-white"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 