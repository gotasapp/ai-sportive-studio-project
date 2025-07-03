'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MarketplaceItem {
  name: string;
  image_url: string;
  description: string;
}

interface MarketplaceCarouselProps {
  title: string;
  items: MarketplaceItem[];
}

export default function MarketplaceCarousel({ title, items }: MarketplaceCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesToShow = 3; 
  const maxSlide = items ? Math.max(0, items.length - slidesToShow) : 0;

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, maxSlide));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  if (!items || items.length === 0) {
    return null; // Don't render an empty carousel
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-center text-secondary">{title}</h2>
      <div className="relative">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out" 
            style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
          >
            {items.map((nft, index) => (
              <div key={index} className="w-full md:w-1/3 flex-shrink-0 px-2">
                <div className="bg-gray-800/70 rounded-xl overflow-hidden shadow-lg hover:shadow-accent/30 transition-shadow h-full">
                  <Image 
                    src={nft.image_url} 
                    alt={nft.name} 
                    width={400} 
                    height={400} 
                    className="w-full h-auto object-cover" 
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-secondary">{nft.name}</h3>
                    <p className="text-sm text-gray-400">{nft.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {maxSlide > 0 && (
          <>
            <button 
              onClick={prevSlide} 
              disabled={currentSlide === 0} 
              className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-12 bg-secondary/20 hover:bg-secondary/40 text-white p-2 rounded-full disabled:opacity-50 transition-all"
            >
              <ChevronLeft />
            </button>
            <button 
              onClick={nextSlide} 
              disabled={currentSlide >= maxSlide} 
              className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-12 bg-secondary/20 hover:bg-secondary/40 text-white p-2 rounded-full disabled:opacity-50 transition-all"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 