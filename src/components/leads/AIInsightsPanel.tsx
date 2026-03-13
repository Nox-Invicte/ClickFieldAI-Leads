'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeadScoreBadge } from '@/components/ui/Badge';

interface AIInsightsPanelProps {
  lead: Lead;
  onUpdate: () => void;
}

export function AIInsightsPanel({ lead, onUpdate }: AIInsightsPanelProps) {
  const [scoringLoading, setScoringLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [scoreReasoning, setScoreReasoning] = useState('');
  const [error, setError] = useState('');

  const handleScore = async () => {
    setScoringLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${lead.id}/score`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setScoreReasoning(data.reasoning ?? '');
        onUpdate();
      } else {
        setError(data.error ?? 'Failed to score lead');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setScoringLoading(false);
    }
  };

  const handleSummary = async () => {
    setSummaryLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${lead.id}/summary`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onUpdate();
      } else {
        setError(data.error ?? 'Failed to generate summary');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <Card padding="md">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600">
          <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      {/* Score Section */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lead Score</p>
          <LeadScoreBadge score={lead.score} />
        </div>
        {scoreReasoning && (
          <p className="mb-2 text-xs text-gray-600 italic">&ldquo;{scoreReasoning}&rdquo;</p>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleScore}
          loading={scoringLoading}
          className="w-full"
        >
          {lead.score ? '↻ Re-score with AI' : '⚡ Score with AI'}
        </Button>
      </div>

      {/* Follow-up Suggestion */}
      {lead.aiFollowUp && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            AI Follow-up Suggestion
          </p>
          <p className="text-xs text-indigo-800">{lead.aiFollowUp}</p>
        </div>
      )}

      {/* Summary Section */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Interaction Summary
        </p>
        {lead.aiSummary ? (
          <p className="mb-2 text-xs text-gray-700">{lead.aiSummary}</p>
        ) : (
          <p className="mb-2 text-xs text-gray-400 italic">No summary generated yet.</p>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSummary}
          loading={summaryLoading}
          className="w-full"
        >
          {lead.aiSummary ? '↻ Regenerate Summary' : '✨ Generate Summary'}
        </Button>
      </div>
    </Card>
  );
}
