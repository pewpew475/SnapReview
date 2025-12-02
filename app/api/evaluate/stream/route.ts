import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateCodeStreaming } from '../../../../lib/ai/evaluator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { task_id, user_id } = await request.json();

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', user_id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    await supabase.from('tasks').update({ status: 'processing' }).eq('id', task_id);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          await evaluateCodeStreaming(task, (chunk) => {
            fullResponse += chunk;
            const data = encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            controller.enqueue(data);
          });

          const { parseAIResponse } = await import('../../../../lib/ai/evaluator');
          const evaluationResult = parseAIResponse(fullResponse);

          await supabase.from('evaluations').insert({
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
          });

          await supabase.from('tasks').update({ status: 'completed' }).eq('id', task_id);

          controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          controller.close();
        } catch (error: any) {
          const errorData = encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          controller.enqueue(errorData);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
