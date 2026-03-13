'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LEAD_SOURCE_LABELS } from '@/types';

const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'WEBSITE',
    estimatedValue: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        source: form.source,
      };
      if (form.phone) body.phone = form.phone;
      if (form.company) body.company = form.company;
      if (form.estimatedValue) body.estimatedValue = parseFloat(form.estimatedValue);

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create lead');
        return;
      }

      setForm({ name: '', email: '', phone: '', company: '', source: 'WEBSITE', estimatedValue: '' });
      onSuccess();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name *"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Jane Smith"
            required
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jane@company.com"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Acme Inc."
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Lead Source *"
            options={SOURCE_OPTIONS}
            value={form.source}
            onChange={(e) => handleChange('source', e.target.value)}
          />
          <Input
            label="Est. Value ($)"
            type="number"
            min="0"
            step="100"
            value={form.estimatedValue}
            onChange={(e) => handleChange('estimatedValue', e.target.value)}
            placeholder="5000"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
