'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';

interface FeaturedNFT {
  name: string;
  collection: string;
  image_url: string;
  creator_image_url: string;
}

export default function FeaturedCarousel() {
  const [featuredNFTs, setFeaturedNFTs] = useState<FeaturedNFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadFeaturedData = async () => {
      try {
        const response = await fetch('/marketplace-images.json');
        const data = await response.json();
        setFeaturedNFTs(data.featured_nfts || []);
      } catch (error) {
        console.error('Error loading featured NFTs:', error);
      }
    };
    loadFeaturedData();
  }, []);
  
  // Auto-scroll
  useEffect(() => {
    if(featuredNFTs.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % featuredNFTs.length);
    }, 5000); // muda a cada 5 segundos
    return () => clearInterval(timer);
  }, [featuredNFTs.length]);


  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + featuredNFTs.length) % featuredNFTs.length);
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % featuredNFTs.length);
  };
  
  if (featuredNFTs.length === 0) {
    return (
        <div className="w-full h-[450px] bg-card rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  const activeNFT = featuredNFTs[currentIndex];

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <Image
        src={activeNFT.image_url}
        alt={activeNFT.name}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-500 ease-in-out group-hover:scale-105"
      />
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 text-white">
        <h2 className="text-4xl font-bold mb-2">{activeNFT.name}</h2>
        <div className="flex items-center space-x-3">
          <Image
            src={activeNFT.creator_image_url}
            alt="Creator"
            width={40}
            height={40}
            className="rounded-full border-2 border-accent"
          />
          <span className="font-semibold text-lg">{activeNFT.collection}</span>
        </div>
      </div>
      
      {/* Navigation */}
       <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={24} />
      </button>
      <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={24} />
      </button>
      
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {featuredNFTs.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full ${currentIndex === index ? 'bg-accent' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
} 