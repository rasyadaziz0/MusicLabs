'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function useMetrics(range: 'day' | 'week' | 'month' = 'day') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL || '';
      const res = await fetch(`${apiUrl}/api/metrics/latency?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const json = await res.json();
      
      // Format timestamp for display
      const formatted = json.data?.map((d: any) => {
        const date = new Date(d.timestamp);
        return {
          ...d,
          time: range === 'day' 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        };
      }) || [];
      
      setData(formatted);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { data, loading };
}

export function SystemMetricsChart() {
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const { data, loading } = useMetrics(range);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-white/90">
          REST API Latency
        </h2>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          {(['day', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                range === r 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
            <span className="h-6 w-6 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin" />
          </div>
        )}
        
        {data.length === 0 && !loading ? (
          <div className="flex h-full items-center justify-center text-[14px] text-white/40">
            No metrics data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  fontSize: '13px'
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [
                  `${value}ms`, 
                  name === 'Average Latency' ? 'Avg Latency' : 'Max Latency'
                ]}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}
              />
              <Line 
                type="monotone" 
                dataKey="avg_latency_ms" 
                stroke="#34d399" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#34d399', stroke: '#000', strokeWidth: 2 }}
                name="Average Latency"
              />
              <Line 
                type="monotone" 
                dataKey="max_latency_ms" 
                stroke="#f87171" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f87171', stroke: '#000', strokeWidth: 2 }}
                name="Max Latency"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
