import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export type LeadScoreResult = {
  score: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  followUpSuggestion: string;
};

export async function scoreLeadWithAI(leadData: {
  name: string;
  company?: string | null;
  source: string;
  status: string;
  estimatedValue?: number | null;
  interactions: Array<{ type: string; content: string; createdAt: Date }>;
}): Promise<LeadScoreResult> {
  const interactionText = leadData.interactions
    .map((i) => `[${i.type} - ${i.createdAt.toLocaleDateString()}]: ${i.content}`)
    .join('\n');

  const prompt = `You are a B2B sales intelligence AI. Analyze this lead and provide a quality score.

Lead Information:
- Name: ${leadData.name}
- Company: ${leadData.company ?? 'Unknown'}
- Lead Source: ${leadData.source}
- Current Status: ${leadData.status}
- Estimated Deal Value: ${leadData.estimatedValue ? `$${leadData.estimatedValue}` : 'Unknown'}

Interaction History:
${interactionText || 'No interactions yet.'}

Respond with a JSON object in this exact format:
{
  "score": "HOT" | "WARM" | "COLD",
  "reasoning": "Brief explanation of the score (1-2 sentences)",
  "followUpSuggestion": "Specific actionable next step for the sales manager (1-2 sentences)"
}`;

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content ?? '{}';
  return JSON.parse(content) as LeadScoreResult;
}

export async function summarizeLeadHistory(leadData: {
  name: string;
  company?: string | null;
  interactions: Array<{ type: string; content: string; createdAt: Date }>;
}): Promise<string> {
  if (leadData.interactions.length === 0) {
    return 'No interaction history available for this lead yet.';
  }

  const interactionText = leadData.interactions
    .map((i) => `[${i.type} - ${i.createdAt.toLocaleDateString()}]: ${i.content}`)
    .join('\n');

  const prompt = `Summarize the following sales interaction history for lead "${leadData.name}" from "${leadData.company ?? 'Unknown Company'}" in 2-3 concise sentences. Focus on key discussion points, pain points identified, and current stage of the deal.

Interaction History:
${interactionText}`;

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  });

  return response.choices[0].message.content ?? 'Unable to generate summary.';
}
