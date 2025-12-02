import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('id, overall_score, summary, strengths, readability_score, efficiency_score, maintainability_score, security_score, is_unlocked, created_at')
      .eq('id', id)
      .single();

    if (error || !evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: evaluation.id,
      overall_score: evaluation.overall_score,
      summary: evaluation.summary,
      strengths_preview: (evaluation.strengths || []).slice(0, 3),
      scores: {
        readability: evaluation.readability_score,
        efficiency: evaluation.efficiency_score,
        maintainability: evaluation.maintainability_score,
        security: evaluation.security_score,
      },
      is_unlocked: evaluation.is_unlocked,
      created_at: evaluation.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
