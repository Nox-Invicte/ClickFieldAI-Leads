'use client';

import Link from 'next/link';
import { Lead, LeadSource, LeadStatus, LeadScore, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/types';
import { LeadScoreBadge, LeadStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface LeadTableProps {
  leads: Lead[];
  loading?: boolean;
}

export function LeadTable({ leads, loading }: LeadTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="mb-3 size-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No leads found</p>
        <p className="text-xs text-gray-400">Add your first lead to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Lead</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Source</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Score</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Value</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Added</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="group hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="hover:text-indigo-600 transition-colors">
                  <p className="font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.email}</p>
                  {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-gray-600">{LEAD_SOURCE_LABELS[lead.source]}</span>
              </td>
              <td className="px-4 py-3">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3">
                <LeadScoreBadge score={lead.score} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {formatRelativeTime(lead.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
