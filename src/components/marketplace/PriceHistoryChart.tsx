"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceHistoryChart({ data }: { data: { date: string, price: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="w-full h-40 bg-gray-900 rounded" />;
  }
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF0052" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#FF0052" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={false} axisLine={false} />
          <YAxis tick={{ fill: "#FDFDFD", fontSize: 12 }} axisLine={false} width={40} />
          <Tooltip contentStyle={{ background: "#14101e", border: "none", color: "#FDFDFD" }} labelFormatter={v => `Date: ${v}`} />
          <Area type="monotone" dataKey="price" stroke="#FF0052" fillOpacity={1} fill="url(#colorPrice)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 