'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CollectionStat {
  rank: number;
  name: string;
  imageUrl: string;
  floorPrice: string;
  volume24h: string;
  volumeChange: number;
  items: string;
  listedPercentage: number;
}

const MOCK_COLLECTIONS: CollectionStat[] = [
  {
    rank: 1,
    name: 'Official Jerseys',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
    floorPrice: '0.15 ETH',
    volume24h: '12.3 ETH',
    volumeChange: 15.5,
    items: '1.2K',
    listedPercentage: 8.4,
  },
  {
    rank: 2,
    name: 'World Stadiums',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
    floorPrice: '0.25 ETH',
    volume24h: '8.1 ETH',
    volumeChange: -4.2,
    items: '500',
    listedPercentage: 12.1,
  },
  {
    rank: 3,
    name: 'Champion Badges',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636633/bafybeigiluwv7wjg3rmwwnjfjndvbiy7vkusihwyvjd3iz3yzudl4kfhia_dmsrtn.png',
    floorPrice: '0.05 ETH',
    volume24h: '5.9 ETH',
    volumeChange: 22.8,
    items: '3.5K',
    listedPercentage: 5.3,
  }
];


export default function RankingsTable() {

  const [collections, setCollections] = useState<CollectionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating a data fetch
    setTimeout(() => {
      setCollections(MOCK_COLLECTIONS);
      setLoading(false);
    }, 1000);
  }, []);

  const renderChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {Math.abs(change)}%
      </span>
    );
  };
  
  return (
    <div className="bg-card rounded-2xl p-6 border border-secondary/10">
      <h2 className="text-2xl font-bold text-white mb-4">Top Collections</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-secondary/10 text-secondary">
              <th className="p-4 text-sm font-semibold">#</th>
              <th className="p-4 text-sm font-semibold">Collection</th>
              <th className="p-4 text-sm font-semibold text-right">Floor Price</th>
              <th className="p-4 text-sm font-semibold text-right">24h Volume</th>
              <th className="p-4 text-sm font-semibold text-right">Items</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-secondary/10 animate-pulse">
                  <td className="p-4"><div className="h-6 w-6 bg-secondary/10 rounded-md"></div></td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg"></div>
                      <div className="h-6 w-32 bg-secondary/10 rounded-md"></div>
                    </div>
                  </td>
                  <td className="p-4 text-right"><div className="h-6 w-20 bg-secondary/10 rounded-md ml-auto"></div></td>
                  <td className="p-4 text-right"><div className="h-6 w-24 bg-secondary/10 rounded-md ml-auto"></div></td>
                  <td className="p-4 text-right"><div className="h-6 w-16 bg-secondary/10 rounded-md ml-auto"></div></td>
                </tr>
              ))
            ) : (
              collections.map(col => (
                <tr key={col.rank} className="border-b border-secondary/10 hover:bg-secondary/5 transition-colors">
                  <td className="p-4 font-bold text-white">{col.rank}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <Image src={col.imageUrl} alt={col.name} width={48} height={48} className="rounded-lg"/>
                      <span className="font-semibold text-white">{col.name}</span>
                    </div>
                  </td>
                   <td className="p-4 text-right font-mono text-white">{col.floorPrice}</td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-white">{col.volume24h}</span>
                      {renderChange(col.volumeChange)}
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-white">{col.items}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 