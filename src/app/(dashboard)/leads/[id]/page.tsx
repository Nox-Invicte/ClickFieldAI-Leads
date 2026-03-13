'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lead, LEAD_STATUS_LABELS } from '@/types';
import { AIInsightsPanel } from '@/components/leads/AIInsightsPanel';
import { InteractionList } from '@/components/leads/InteractionList';
import { LeadScoreBadge, LeadStatusBadge, LeadSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) {
        if (res.status === 404) router.push('/leads');
        return;
      }
      const data = await res.json();
      setLead(data);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead((prev) => (prev ? { ...prev, status: data.status, convertedAt: data.convertedAt } : prev));
      }
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/leads');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-white border border-gray-200" />
            <div className="h-64 animate-pulse rounded-xl bg-white border border-gray-200" />
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-white border border-gray-200" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/leads" className="hover:text-indigo-600">Leads</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{lead.name}</span>
      </div>

      {/* Lead Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
              <LeadScoreBadge score={lead.score} />
              <LeadStatusBadge status={lead.status} />
            </div>
            {lead.company && <p className="text-sm text-gray-600 font-medium">{lead.company}</p>}
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {lead.phone}
                </span>
              )}
              <LeadSourceBadge source={lead.source} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Added: {formatDate(lead.createdAt)}</span>
              {lead.convertedAt && <span>Won: {formatDate(lead.convertedAt)}</span>}
              {lead.estimatedValue && (
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(lead.estimatedValue)} est. value
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select
                options={STATUS_OPTIONS}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
              />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Interactions */}
        <div className="lg:col-span-2">
          <Card>
            <InteractionList
              leadId={id}
              interactions={lead.interactions ?? []}
              onUpdate={fetchLead}
            />
          </Card>
        </div>

        {/* Right: AI Panel */}
        <div>
          <AIInsightsPanel lead={lead} onUpdate={fetchLead} />
        </div>
      </div>
    </div>
  );
}
