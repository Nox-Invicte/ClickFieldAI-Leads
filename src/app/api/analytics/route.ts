import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const token = req.cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: allLeads, error: allLeadsError }, { data: recentLeads, error: recentLeadsError }] =
    await Promise.all([
      supabase.from('Lead').select('source, score, status, estimatedValue'),
      supabase
        .from('Lead')
        .select('id, name, company, source, score, status, estimatedValue, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5),
    ]);

  if (allLeadsError || recentLeadsError) {
    console.error('Analytics query error:', allLeadsError ?? recentLeadsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const leads = allLeads ?? [];
  const totalLeads = leads.length;
  const wonLeads = leads.filter((lead) => lead.status === 'WON').length;

  const bySource = new Map<string, { source: string; count: number; totalValue: number }>();
  const byScore = new Map<string, { score: string | null; count: number }>();
  const byStatus = new Map<string, { status: string; count: number }>();

  let totalRevenue = 0;

  for (const lead of leads) {
    const source = lead.source as string;
    const score = (lead.score as string | null) ?? null;
    const status = lead.status as string;
    const estimatedValue = Number(lead.estimatedValue ?? 0);

    if (status === 'WON') {
      totalRevenue += estimatedValue;
    }

    const sourceEntry = bySource.get(source) ?? { source, count: 0, totalValue: 0 };
    sourceEntry.count += 1;
    sourceEntry.totalValue += estimatedValue;
    bySource.set(source, sourceEntry);

    if (score) {
      const scoreEntry = byScore.get(score) ?? { score, count: 0 };
      scoreEntry.count += 1;
      byScore.set(score, scoreEntry);
    }

    const statusEntry = byStatus.get(status) ?? { status, count: 0 };
    statusEntry.count += 1;
    byStatus.set(status, statusEntry);
  }

  const conversionRate =
    totalLeads > 0 ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    overview: {
      totalLeads,
      wonLeads,
      conversionRate,
      totalRevenue,
    },
    revenueBySource: Array.from(bySource.values()),
    leadsByScore: Array.from(byScore.values()),
    leadsByStatus: Array.from(byStatus.values()),
    recentLeads: recentLeads ?? [],
  });
}
