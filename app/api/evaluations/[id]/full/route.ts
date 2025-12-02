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
      .select('*')
      .eq('id', id)
      .single();

    if (error || !evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    if (!evaluation.is_unlocked) {
      return NextResponse.json({ error: 'Evaluation is locked. Payment required.' }, { status: 403 });
    }

    return NextResponse.json({
      id: evaluation.id,
      overall_score: evaluation.overall_score,
      scores: {
        readability: evaluation.readability_score,
        efficiency: evaluation.efficiency_score,
        maintainability: evaluation.maintainability_score,
        security: evaluation.security_score,
      },
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      refactored_code: evaluation.refactored_code,
      detailed_analysis: evaluation.detailed_analysis,
      is_unlocked: evaluation.is_unlocked,
      created_at: evaluation.created_at,
      unlocked_at: evaluation.unlocked_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
