import { motion } from 'framer-motion';
import { Loader2, Database, Zap, CheckCircle } from 'lucide-react';

interface ProgressiveLoaderProps {
  progress: {
    current: number;
    total: number;
    stage: 'loading' | 'processing' | 'complete';
  };
  className?: string;
}

export default function ProgressiveLoader({ progress, className = '' }: ProgressiveLoaderProps) {
  const percentage = Math.round((progress.current / progress.total) * 100);

  const getStageInfo = () => {
    switch (progress.stage) {
      case 'loading':
        return {
          icon: Database,
          text: 'Loading marketplace data...',
          color: 'text-blue-400'
        };
      case 'processing':
        return {
          icon: Zap,
          text: 'Processing NFTs...',
          color: 'text-yellow-400'
        };
      case 'complete':
        return {
          icon: CheckCircle,
          text: 'Marketplace ready!',
          color: 'text-green-400'
        };
      default:
        return {
          icon: Loader2,
          text: 'Loading...',
          color: 'text-[#FDFDFD]/70'
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {progress.stage === 'complete' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <Icon className={`w-12 h-12 ${stageInfo.color}`} />
          </motion.div>
        ) : (
          <Icon className={`w-12 h-12 ${stageInfo.color} ${progress.stage === 'loading' ? 'animate-spin' : 'animate-pulse'}`} />
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="flex justify-between text-sm text-[#FDFDFD]/70 mb-2">
          <span>{stageInfo.text}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-[#FDFDFD]/10 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#A20131] to-[#E91E63] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stage Text */}
      <motion.p
        key={progress.stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center text-[#FDFDFD]/70 text-sm max-w-md"
      >
        {progress.stage === 'loading' && 'Fetching the latest NFTs from the blockchain...'}
        {progress.stage === 'processing' && 'Organizing collections and preparing marketplace...'}
        {progress.stage === 'complete' && 'All set! Enjoy browsing the marketplace.'}
      </motion.p>

      {/* Loading dots animation */}
      {progress.stage !== 'complete' && (
        <div className="flex items-center mt-4 space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#A20131] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente mais simples para uso em locais menores
export function MiniProgressiveLoader({ stage }: { stage: 'loading' | 'processing' | 'complete' }) {
  const getIcon = () => {
    switch (stage) {
      case 'loading':
        return <Database className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-[#FDFDFD]/70">
      {getIcon()}
      <span>
        {stage === 'loading' && 'Loading...'}
        {stage === 'processing' && 'Processing...'}
        {stage === 'complete' && 'Ready!'}
      </span>
    </div>
  );
} 