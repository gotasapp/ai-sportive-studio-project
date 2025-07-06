'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';

interface MarketplaceCardProps {
  name: string;
  imageUrl: string;
  price: string;
  collection: string;
  category?: 'jersey' | 'stadium' | 'badge' | string;
}

const categoryColors = {
    jersey: 'bg-blue-500',
    stadium: 'bg-green-500',
    badge: 'bg-purple-500',
    default: 'bg-gray-500',
};


export default function MarketplaceCard({ name, imageUrl, price, collection, category }: MarketplaceCardProps) {
  const color = category ? categoryColors[category as keyof typeof categoryColors] || categoryColors.default : categoryColors.default;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-secondary/10 group transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10">
      <div className="relative aspect-square">
        <Image 
          src={imageUrl} 
          alt={name}
          layout="fill"
          objectFit="cover"
          className="group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full cursor-pointer hover:text-accent">
            <Heart size={18} />
        </div>
        <div className={`absolute top-3 left-3 body-caption font-bold px-2 py-1 rounded-full ${color}`}>
            {category?.toUpperCase()}
        </div>
      </div>
      <div className="p-4">
        <p className="body-small truncate">{collection}</p>
        <h3 className="heading-4 truncate my-1">{name}</h3>
        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="body-caption">Price</p>
            <p className="ui-label">{price}</p>
          </div>
          <button className="bg-accent text-white px-5 py-2 rounded-lg ui-button hover:bg-accent/90 transition-colors">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
} 