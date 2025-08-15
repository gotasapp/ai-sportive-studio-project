import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export type MarketplaceStatsBarMobileProps = {
  volume24h: string;
  volumeChange: number; // percentual, ex: -18.0
  sales24h: string;
  salesChange: number; // percentual, ex: 279
};

export default function MarketplaceStatsBarMobile({
  volume24h,
  volumeChange,
  sales24h,
  salesChange,
}: MarketplaceStatsBarMobileProps) {
  return (
    <Card className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#181828] border-none shadow-sm w-full max-w-full">
      {/* Vol (24h) */}
      <div className="flex flex-col items-start min-w-[90px]">
        <span className="text-xs text-white/70 font-medium">Vol (24h)</span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#FF0052]">{volume24h}</span>
          <span className={`flex items-center text-xs font-semibold ${volumeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {volumeChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(volumeChange).toFixed(1)}%
          </span>
        </div>
      </div>
      {/* Sales (24h) */}
      <div className="flex flex-col items-end min-w-[90px]">
        <span className="text-xs text-white/70 font-medium">Sales (24h)</span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#FF0052]">{sales24h}</span>
          <span className={`flex items-center text-xs font-semibold ${salesChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {salesChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(salesChange).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
} 