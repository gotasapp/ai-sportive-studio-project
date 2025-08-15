'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Trait {
  trait_type: string;
  value: string;
  count?: number;
  percentage?: number;
}

interface CollectionTraitsProps {
  traits?: Trait[];
  totalSupply?: number;
  collectionData?: any;
}

export default function CollectionTraits({ traits = [], totalSupply = 0, collectionData }: CollectionTraitsProps) {
  const [expandedTraits, setExpandedTraits] = useState<string[]>(['all']);

  // Usar traits reais da coleção
  const processedTraits: Trait[] = [];
  
  // Adicionar os traits reais da API
  if (collectionData) {
    if (collectionData.category) {
      processedTraits.push({
        trait_type: 'Category',
        value: collectionData.category,
        count: totalSupply,
        percentage: 100
      });
    }
    
    if (collectionData.teamName) {
      processedTraits.push({
        trait_type: 'Team',
        value: collectionData.teamName,
        count: totalSupply,
        percentage: 100
      });
    }
    
    if (collectionData.stats?.uniqueOwners) {
      processedTraits.push({
        trait_type: 'Unique Owners',
        value: String(collectionData.stats.uniqueOwners),
        count: collectionData.stats.uniqueOwners,
        percentage: 100
      });
    }
    
    if (collectionData.stats?.contractsUsed) {
      processedTraits.push({
        trait_type: 'Contracts Used',
        value: String(collectionData.stats.contractsUsed),
        count: collectionData.stats.contractsUsed,
        percentage: 100
      });
    }
    
    if (collectionData.season) {
      processedTraits.push({
        trait_type: 'Season',
        value: collectionData.season,
        count: totalSupply,
        percentage: 100
      });
    }
    
    processedTraits.push({
      trait_type: 'Type',
      value: 'AI Generated',
      count: totalSupply,
      percentage: 100
    });
  }

  const toggleTrait = (traitType: string) => {
    setExpandedTraits(prev => 
      prev.includes(traitType) 
        ? prev.filter(t => t !== traitType)
        : [...prev, traitType]
    );
  };

  return (
    <Card className="bg-transparent border-[#FDFDFD]/10">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-[#FDFDFD] text-lg font-semibold flex items-center gap-2">
          <span className="text-[#FDFDFD]/70">Traits</span>
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs bg-[#FDFDFD]/5 border-[#FDFDFD]/20 text-[#FDFDFD]/70">
            {processedTraits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {processedTraits.map((trait, index) => {
            const isExpanded = expandedTraits.includes(trait.trait_type) || expandedTraits.includes('all');
            const percentage = trait.percentage || (trait.count && totalSupply ? (trait.count / totalSupply * 100) : 0);
            
            return (
              <div key={index} className="space-y-2">
                <button
                  onClick={() => toggleTrait(trait.trait_type)}
                  className="w-full flex items-center justify-between hover:bg-[#FDFDFD]/5 rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronUp 
                      className={`h-4 w-4 text-[#FDFDFD]/50 transition-transform ${!isExpanded ? 'rotate-180' : ''}`}
                    />
                    <span className="text-sm font-medium text-[#FDFDFD]/70">{trait.trait_type}</span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="pl-7 space-y-2">
                    <div className="flex items-center justify-between bg-[#14101e] rounded-lg p-3 border border-[#FDFDFD]/10">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#FDFDFD]">{trait.value}</span>
                        <Badge 
                          variant="outline" 
                          className="rounded-full px-2 py-0.5 text-xs bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052]"
                        >
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#FDFDFD]/50">{trait.count || totalSupply}</span>
                        <span className="text-xs text-[#FDFDFD]/30">items</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}