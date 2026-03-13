'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { RevenueBySource, LEAD_SOURCE_LABELS } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: RevenueBySource[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    source: LEAD_SOURCE_LABELS[d.source],
    revenue: d.totalValue,
    leads: d.count,
  }));

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Revenue by Lead Source</h3>
        <p className="text-sm text-gray-500">Total estimated deal value per channel</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          accessibilityLayer={false}
          tabIndex={-1}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="source" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
            cursor={false}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
