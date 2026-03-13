import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createInteractionSchema = z.object({
  type: z.enum(['EMAIL', 'CHAT', 'NOTE', 'CALL']),
  content: z.string().min(1, 'Content is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseServerClient();
  const token = req.cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: leadExists, error: leadError } = await supabase
    .from('Lead')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (leadError) {
    console.error('Lead existence error:', leadError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!leadExists) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createInteractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: interaction, error } = await supabase
    .from('Interaction')
    .insert({
      id: randomUUID(),
      leadId: id,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !interaction) {
    console.error('Interaction create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(interaction, { status: 201 });
}
