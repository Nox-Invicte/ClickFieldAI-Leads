'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';
import { LeadScore } from '@/types';

interface ScoreDistributionProps {
  data: Array<{ score: LeadScore | null; count: number }>;
}

const SCORE_COLORS: Record<string, string> = {
  HOT: '#ef4444',
  WARM: '#f59e0b',
  COLD: '#0ea5e9',
};

const SCORE_LABELS: Record<string, string> = {
  HOT: '🔥 Hot',
  WARM: '🌤 Warm',
  COLD: '❄️ Cold',
};

export function ScoreDistribution({ data }: ScoreDistributionProps) {
  const chartData = data
    .filter((d) => d.score !== null)
    .map((d) => ({
      name: SCORE_LABELS[d.score!] ?? d.score,
      value: d.count,
      color: SCORE_COLORS[d.score!] ?? '#9ca3af',
    }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Lead Score Distribution</h3>
        <p className="text-sm text-gray-500">{total} scored leads</p>
      </div>
      {total === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          No scored leads yet. Score leads using AI.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart accessibilityLayer={false}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              rootTabIndex={-1}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, 'Leads']}
              cursor={false}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
