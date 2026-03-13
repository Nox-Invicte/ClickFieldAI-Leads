'use client';

import { useState } from 'react';
import { Interaction } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'CALL', label: 'Call' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'NOTE', label: 'Note' },
];

const TYPE_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  EMAIL: { icon: '✉️', bg: 'bg-blue-50', color: 'text-blue-700' },
  CALL: { icon: '📞', bg: 'bg-emerald-50', color: 'text-emerald-700' },
  CHAT: { icon: '💬', bg: 'bg-purple-50', color: 'text-purple-700' },
  NOTE: { icon: '📝', bg: 'bg-amber-50', color: 'text-amber-700' },
};

interface InteractionListProps {
  leadId: string;
  interactions: Interaction[];
  onUpdate: () => void;
}

export function InteractionList({ leadId, interactions, onUpdate }: InteractionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('NOTE');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: content.trim() }),
      });
      if (res.ok) {
        setContent('');
        setShowForm(false);
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Interaction History ({interactions.length})
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Select
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-32"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the interaction..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            required
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" loading={loading}>
              Save
            </Button>
          </div>
        </form>
      )}

      {interactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No interactions recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => {
            const config = TYPE_ICONS[interaction.type] ?? TYPE_ICONS.NOTE;
            return (
              <div key={interaction.id} className="flex gap-3">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-base',
                    config.bg
                  )}
                >
                  {config.icon}
                </div>
                <div className="flex-1 rounded-lg border border-gray-100 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', config.color)}>
                      {interaction.type}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(interaction.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
