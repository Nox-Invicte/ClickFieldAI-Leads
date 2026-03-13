'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Analytics } from '@/types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ScoreDistribution } from '@/components/dashboard/ScoreDistribution';
import { LeadScoreBadge, LeadStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white border border-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-72 animate-pulse rounded-xl bg-white border border-gray-200" />
          <div className="h-72 animate-pulse rounded-xl bg-white border border-gray-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Failed to load analytics. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={data.overview.totalLeads}
          subtitle="All time"
          iconBg="bg-indigo-50"
          icon={
            <svg className="size-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Deals Won"
          value={data.overview.wonLeads}
          subtitle="Converted leads"
          iconBg="bg-emerald-50"
          icon={
            <svg className="size-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          subtitle="Leads to won"
          iconBg="bg-amber-50"
          icon={
            <svg className="size-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.overview.totalRevenue)}
          subtitle="From won deals"
          iconBg="bg-sky-50"
          icon={
            <svg className="size-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 font-bold">
        <div className="lg:col-span-2 text-indigo-500 font-bold">
          <RevenueChart data={data.revenueBySource} />
        </div>
        <ScoreDistribution data={data.leadsByScore} />
      </div>

      {/* Recent Leads */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
          <Link
            href="/leads"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data.recentLeads.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No leads yet. Add your first lead.</p>
          ) : (
            data.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {lead.name}
                    {lead.company && (
                      <span className="ml-1 font-normal text-gray-400">· {lead.company}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(lead.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <LeadScoreBadge score={lead.score} />
                  <LeadStatusBadge status={lead.status} />
                  {lead.estimatedValue && (
                    <span className="text-xs font-medium text-gray-600">
                      {formatCurrency(lead.estimatedValue)}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
