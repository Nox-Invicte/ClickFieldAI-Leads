import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';
import { summarizeLeadHistory } from '@/lib/openai';

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

  const [{ data: lead, error: leadError }, { data: interactions, error: interactionsError }] =
    await Promise.all([
      supabase.from('Lead').select('id, name, company').eq('id', id).maybeSingle(),
      supabase
        .from('Interaction')
        .select('type, content, createdAt')
        .eq('leadId', id)
        .order('createdAt', { ascending: true }),
    ]);

  if (leadError || interactionsError) {
    console.error('Lead summary fetch error:', leadError ?? interactionsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const summary = await summarizeLeadHistory({
    name: lead.name,
    company: lead.company,
    interactions: (interactions ?? []).map((interaction) => ({
      type: interaction.type as string,
      content: interaction.content as string,
      createdAt: new Date(interaction.createdAt as string),
    })),
  });

  const { data: updated, error: updateError } = await supabase
    .from('Lead')
    .update({ aiSummary: summary })
    .eq('id', id)
    .select('aiSummary')
    .single();

  if (updateError || !updated) {
    console.error('Lead summary update error:', updateError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ summary: updated.aiSummary });
}
