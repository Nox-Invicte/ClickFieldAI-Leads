import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['WEBSITE', 'EMAIL', 'REFERRAL', 'LINKEDIN', 'COLD_OUTREACH', 'EVENT', 'OTHER']),
  estimatedValue: z.number().positive().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
});

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const search = (searchParams.get('search') ?? '').trim();
  const source = searchParams.get('source');
  const score = searchParams.get('score');
  const status = searchParams.get('status');

  let query = supabase.from('Lead').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (source) query = query.eq('source', source);
  if (score) query = query.eq('score', score);
  if (status) query = query.eq('status', status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: leadRows, error: leadsError, count } = await query
    .order('createdAt', { ascending: false })
    .range(from, to);

  if (leadsError) {
    console.error('Leads fetch error:', leadsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  let leads = leadRows ?? [];

  if (leads.length > 0) {
    const leadIds = leads.map((lead) => lead.id as string);
    const { data: interactionRows, error: interactionsError } = await supabase
      .from('Interaction')
      .select('leadId')
      .in('leadId', leadIds);

    if (interactionsError) {
      console.error('Interaction count error:', interactionsError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const interactionCountByLead = (interactionRows ?? []).reduce<Record<string, number>>(
      (acc, row) => {
        const leadId = row.leadId as string;
        acc[leadId] = (acc[leadId] ?? 0) + 1;
        return acc;
      },
      {}
    );

    leads = leads.map((lead) => ({
      ...lead,
      _count: { interactions: interactionCountByLead[lead.id as string] ?? 0 },
    }));
  }

  const total = count ?? 0;

  return NextResponse.json({ leads, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseServerClient();

  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const leadPayload = {
    id: randomUUID(),
    ...parsed.data,
    assignedToId: payload.userId,
    updatedAt: new Date().toISOString(),
  };

  const { data: lead, error } = await supabase
    .from('Lead')
    .insert(leadPayload)
    .select('*')
    .single();

  if (error?.code === '23503') {
    // If a mirrored profile row is missing, still allow lead creation without assignment.
    const { data: unassignedLead, error: retryError } = await supabase
      .from('Lead')
      .insert({ ...leadPayload, assignedToId: null })
      .select('*')
      .single();

    if (retryError || !unassignedLead) {
      console.error('Lead create retry error:', retryError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(unassignedLead, { status: 201 });
  }

  if (error || !lead) {
    console.error('Lead create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(lead, { status: 201 });
}
