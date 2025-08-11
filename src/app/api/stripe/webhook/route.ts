import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
    const result = await handleWebhook(body, signature, webhookSecret)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}