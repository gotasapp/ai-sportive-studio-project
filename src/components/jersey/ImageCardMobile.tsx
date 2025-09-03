import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, PlayCircle, RefreshCw, Share2 } from 'lucide-react';
import Image from 'next/image';

interface ImageCardProps {
  mainImage: string;
  thumbnails: string[];
  onDownload: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onAnimate?: () => void;
  username?: string;
}

export default function ImageCardMobile({
  mainImage,
  thumbnails,
  onDownload,
  onShare,
  onRegenerate,
  onAnimate,
  username
}: ImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-gradient-to-br from-[#1e1e2f] to-[#0f0f1a] shadow-xl border border-[#2c2c3c]"
    >
      <div className="relative w-full h-96 rounded-xl overflow-hidden mb-4">
        <Image
          src={mainImage}
          alt="Generated"
          layout="fill"
          objectFit="cover"
          className="rounded-xl"
        />
        {onAnimate && (
          <Button
            size="sm"
            className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md text-white px-4"
            onClick={onAnimate}
          >
            <PlayCircle className="w-4 h-4 mr-2" /> Animate
          </Button>
        )}
      </div>

      {/* Removido o bloco de thumbnails para aumentar a altura da imagem principal */}

      <div className="flex items-center justify-between mt-4">
        <Button onClick={onShare} size="icon" variant="ghost">
          <Share2 className="w-5 h-5 text-white" />
        </Button>

        <Button
          onClick={onRegenerate}
          className="bg-gradient-to-r from-[#1b1b40] to-[#8c22f3] text-white px-6"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Re-Generate
        </Button>

        <Button onClick={onDownload} size="icon" className="bg-pink-600 text-white">
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
} 