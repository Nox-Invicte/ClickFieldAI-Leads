import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  source: z
    .enum(['WEBSITE', 'EMAIL', 'REFERRAL', 'LINKEDIN', 'COLD_OUTREACH', 'EVENT', 'OTHER'])
    .optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
  estimatedValue: z.number().positive().nullable().optional(),
});

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseServerClient();
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const { data: lead, error: leadError } = await supabase
    .from('Lead')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (leadError) {
    console.error('Lead detail error:', leadError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: interactions, error: interactionsError }, { data: assignedTo, error: assigneeError }] =
    await Promise.all([
      supabase
        .from('Interaction')
        .select('*')
        .eq('leadId', id)
        .order('createdAt', { ascending: false }),
      lead.assignedToId
        ? supabase
            .from('User')
            .select('id, name, email')
            .eq('id', lead.assignedToId as string)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (interactionsError || assigneeError) {
    console.error('Lead relation fetch error:', interactionsError ?? assigneeError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    ...lead,
    interactions: interactions ?? [],
    assignedTo,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseServerClient();
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };
  if (parsed.data.status === 'WON') {
    updateData.convertedAt = new Date().toISOString();
  }
  if (parsed.data.status === 'LOST') {
    updateData.convertedAt = null;
  }

  const { data: lead, error } = await supabase
    .from('Lead')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!lead) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseServerClient();
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const { data: deleted, error } = await supabase
    .from('Lead')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Lead delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Deleted' });
}
