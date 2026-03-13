import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';
import { scoreLeadWithAI } from '@/lib/openai';

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
      supabase.from('Lead').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('Interaction')
        .select('type, content, createdAt')
        .eq('leadId', id)
        .order('createdAt', { ascending: true }),
    ]);

  if (leadError || interactionsError) {
    console.error('Lead score fetch error:', leadError ?? interactionsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const result = await scoreLeadWithAI({
    name: lead.name,
    company: lead.company,
    source: lead.source,
    status: lead.status,
    estimatedValue: lead.estimatedValue,
    interactions: (interactions ?? []).map((interaction) => ({
      type: interaction.type as string,
      content: interaction.content as string,
      createdAt: new Date(interaction.createdAt as string),
    })),
  });

  const { data: updated, error: updateError } = await supabase
    .from('Lead')
    .update({
      score: result.score,
      aiFollowUp: result.followUpSuggestion,
    })
    .eq('id', id)
    .select('score, aiFollowUp')
    .single();

  if (updateError || !updated) {
    console.error('Lead score update error:', updateError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    score: updated.score,
    reasoning: result.reasoning,
    followUpSuggestion: updated.aiFollowUp,
  });
}
