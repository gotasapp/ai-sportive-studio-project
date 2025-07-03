'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface MarketplaceItem {
  name: string;
  image_url: string;
  price: string;
}

interface MarketplaceCarouselProps {
  items: MarketplaceItem[];
  isLoading: boolean;
}

export default function MarketplaceCarousel({ items, isLoading }: MarketplaceCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  const slidesToShow = 3;
  const itemLength = items?.length || 0;
  const maxSlide = itemLength > slidesToShow ? itemLength - slidesToShow : 0;

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStart(clientX);
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const offset = (clientX - dragStart) * 0.6; // Drag resistance
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 80) { // Drag threshold
      if (dragOffset > 0) {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      } else {
        setCurrentSlide(prev => Math.min(prev + 1, maxSlide));
      }
    }
    setDragOffset(0);
  };

  const handleScrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSlide(parseInt(e.target.value, 10));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('❌ Error loading marketplace image:', target.src);
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.style.background = 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(138, 43, 226, 0.2))';
      const name = parent.getAttribute('data-name') || 'X';
      parent.innerHTML += `<div class="absolute inset-0 flex items-center justify-center text-accent/60 font-bold text-xs">${name.charAt(0)}</div>`;
    }
  };
  
  return (
    <div className="border border-neutral-800 rounded-lg mt-4">
      <div className="bg-black p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading-style text-sm">Marketplace</h2>
          <div className="text-xs text-gray-400">
            Drag to scroll • {currentSlide + 1}-{Math.min(currentSlide + slidesToShow, itemLength)} of {itemLength}
          </div>
        </div>
        
        <div 
          className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseMove={(e) => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
        >
          <div 
            className={`flex ${isDragging ? 'transition-none' : 'transition-transform duration-700 ease-in-out'}`}
            style={{
              transform: `translateX(calc(-${Math.min(currentSlide, maxSlide) * (100 / slidesToShow)}% + ${dragOffset}px))`,
              width: `${(itemLength / slidesToShow) * 100}%`
            }}
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`loading-${index}`} className="flex-shrink-0 px-1" style={{ width: `${100 / itemLength}%` }}>
                  <div className="bg-neutral-900 rounded p-2 transition-all duration-300">
                    <div className="aspect-[4/5] bg-neutral-800 rounded mb-1.5 animate-pulse border border-neutral-700"></div>
                    <div className="space-y-1"><div className="h-2 bg-neutral-700 rounded animate-pulse"></div><div className="h-2 bg-neutral-700 rounded w-2/3 animate-pulse"></div></div>
                  </div>
                </div>
              ))
            ) : itemLength > 0 ? (
              items.map((nft, index) => (
                <div key={`${nft.name}-${index}`} className="flex-shrink-0 px-1 group" style={{ width: `${100 / itemLength}%` }}>
                  <div className="bg-neutral-900 rounded p-2 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="aspect-[4/5] rounded mb-1.5 relative overflow-hidden border border-neutral-700" data-name={nft.name}>
                      {index % 3 === 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 z-10"></div>}
                      <Image src={nft.image_url} alt={nft.name} layout="fill" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none" onError={handleImageError}/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 group-hover:text-accent transition-colors font-medium truncate">{nft.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-accent font-bold text-xs">{nft.price}</span>
                        {index % 3 === 0 && <span className="text-xs text-green-400 bg-green-400/10 px-1 py-0.5 rounded">🔥</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-3"><p className="text-gray-400 text-sm">No marketplace items available</p></div>
            )}
          </div>
        </div>

        <div className="mt-3 px-2">
          <div className="relative">
            <div className="w-full h-2 bg-neutral-800 rounded-full border border-neutral-700">
              <div className="h-full bg-accent rounded-full transition-all duration-300 shadow-lg shadow-accent/20" style={{ width: `${maxSlide > 0 ? (Math.min(currentSlide, maxSlide) / maxSlide) * 100 : 0}%` }}/>
              <div className="absolute top-0 w-4 h-2 bg-accent rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-y-0 transition-all duration-200 hover:scale-110 hover:shadow-accent/50" style={{ left: `${maxSlide > 0 ? (Math.min(currentSlide, maxSlide) / maxSlide) * 100 : 0}%`, transform: 'translateX(-50%)' }}/>
            </div>
            <input type="range" min="0" max={maxSlide} value={currentSlide} onChange={handleScrollChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">{currentSlide + 1} - {Math.min(currentSlide + slidesToShow, itemLength)}</span>
              <span className="text-xs text-gray-400">of {itemLength} items</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <button className="px-4 py-2 border border-accent/30 text-accent rounded hover:border-accent hover:bg-accent/10 transition-all text-sm">View All Items</button>
        </div>
      </div>
    </div>
  );
} 