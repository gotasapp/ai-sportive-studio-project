'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

interface SimpleLikeButtonProps {
  nftId?: string;
  contractAddress?: string;
  tokenId?: string | number;
}

export default function SimpleLikeButton({ nftId, contractAddress, tokenId }: SimpleLikeButtonProps) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    console.log('💖 LIKE BUTTON CLICKED!', { nftId, contractAddress, tokenId, isLiked, currentLikes: likes });
    
    if (isLoading) {
      console.log('💖 Already loading, ignoring click');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('💖 Making POST request to /api/vote-nft...');
      
      const response = await fetch('/api/vote-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nftId: nftId,
          contractAddress,
          tokenId,
          action: isLiked ? 'remove' : 'upvote'
        })
      });

      console.log('💖 Response status:', response.status);
      
      if (!response.ok) {
        console.log('💖 Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('💖 Error response:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('💖 Response data:', data);

      if (data.success) {
        // Usar o valor de votes retornado pela API
        setLikes(data.votes || 0);
        setIsLiked(!isLiked);
        console.log('💖 Vote updated successfully! New votes:', data.votes);
      } else {
        console.log('💖 Vote failed:', data.error);
      }
    } catch (error) {
      console.error('💖 Vote error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all text-white font-bold"
      style={{ pointerEvents: 'auto' }}
    >
      ❤️ LIKE ({likes})
    </button>
  );
}
