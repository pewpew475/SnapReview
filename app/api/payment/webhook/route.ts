import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || request.headers.get('x-signature');

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      const paymentData = event.payload.payment.entity;
      const evaluationId = paymentData.notes?.evaluation_id;

      await supabase.from('payments').update({
        payment_status: 'success',
        completed_at: new Date().toISOString(),
        gateway_response: paymentData,
      }).eq('transaction_id', paymentData.id);

      if (evaluationId) {
        await supabase.from('evaluations').update({ is_unlocked: true, unlocked_at: new Date().toISOString() }).eq('id', evaluationId);
      }

      return NextResponse.json({ status: 'success' });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
