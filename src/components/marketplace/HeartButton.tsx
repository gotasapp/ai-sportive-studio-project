'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface HeartButtonProps {
  nftId: string;
  initialVotes?: number;
  className?: string;
}

export default function HeartButton({ 
  nftId, 
  initialVotes = 0,
  className = "" 
}: HeartButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('💗 Heart clicked!', { nftId, hasVoted, currentVotes: votes });
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Fazer POST direto para o endpoint
      const response = await fetch('/api/nft/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nftId: nftId,
          action: hasVoted ? 'remove' : 'upvote'
        })
      });

      const data = await response.json();
      console.log('📡 Vote response:', data);

      if (data.success) {
        // Atualizar estado local
        if (hasVoted) {
          setVotes(votes - 1);
          setHasVoted(false);
          toast.success('Voto removido!');
        } else {
          setVotes(votes + 1);
          setHasVoted(true);
          toast.success('Obrigado pelo seu voto!');
        }
      } else {
        toast.error(data.error || 'Erro ao votar');
      }
    } catch (error) {
      console.error('❌ Error voting:', error);
      toast.error('Erro ao processar voto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`relative p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all ${className}`}
      type="button"
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          hasVoted ? 'fill-red-500 text-red-500' : 'text-white hover:text-red-400'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {votes > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
          {votes}
        </span>
      )}
    </button>
  );
}