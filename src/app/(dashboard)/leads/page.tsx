'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lead, LeadSource, LeadStatus, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/types';
import { LeadTable } from '@/components/leads/LeadTable';
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  ...Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const SCORE_OPTIONS = [
  { value: '', label: 'All Scores' },
  { value: 'HOT', label: '🔥 Hot' },
  { value: 'WARM', label: '🌤 Warm' },
  { value: 'COLD', label: '❄️ Cold' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [score, setScore] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    if (score) params.set('score', score);

    try {
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, source, status, score]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, source, status, score]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Leads</h2>
          <p className="text-sm text-gray-500">{total} total leads</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex-1 min-w-48">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or company..."
          />
        </div>
        <Select
          label="Source"
          options={SOURCE_OPTIONS}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          label="Score"
          options={SCORE_OPTIONS}
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        {(search || source || status || score) && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setSearch('');
              setSource('');
              setStatus('');
              setScore('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <LeadTable leads={leads} loading={loading} />

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
