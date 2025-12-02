import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateCodeComplete } from '../../../lib/ai/evaluator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { task_id, user_id } = await request.json();

    if (!task_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields: task_id or user_id' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    await supabase.from('tasks').update({ status: 'processing' }).eq('id', task_id);

    const evaluationResult = await evaluateCodeComplete(task);

    const { data: savedEvaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        task_id,
        user_id,
        overall_score: evaluationResult.overall_score,
        readability_score: evaluationResult.scores.readability,
        efficiency_score: evaluationResult.scores.efficiency,
        maintainability_score: evaluationResult.scores.maintainability,
        security_score: evaluationResult.scores.security,
        summary: evaluationResult.summary,
        strengths: evaluationResult.strengths,
        improvements: evaluationResult.improvements,
        refactored_code: evaluationResult.refactored_code,
        detailed_analysis: evaluationResult,
        is_unlocked: false,
        evaluation_status: 'completed',
        ai_model_used: process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2-instruct-0905',
        processing_time_ms: Date.now() - startTime,
      })
      .select()
      .single();

    if (evalError) {
      throw new Error(`Failed to save evaluation: ${evalError.message}`);
    }

    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task_id);

    return NextResponse.json({
      success: true,
      evaluation_id: savedEvaluation.id,
      preview: {
        overall_score: savedEvaluation.overall_score,
        summary: savedEvaluation.summary,
        strengths_preview: savedEvaluation.strengths?.slice(0, 3) || [],
        scores: {
          readability: savedEvaluation.readability_score,
          efficiency: savedEvaluation.efficiency_score,
          maintainability: savedEvaluation.maintainability_score,
          security: savedEvaluation.security_score,
        },
      },
      is_unlocked: false,
      processing_time_ms: savedEvaluation.processing_time_ms,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: 'Failed to process evaluation', details: error.message }, { status: 500 });
  }
}
