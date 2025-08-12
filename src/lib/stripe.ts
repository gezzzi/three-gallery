import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// クライアント側のStripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

// サーバー側のStripe
// 環境変数が設定されていない場合はnullを返す
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export interface CreateCheckoutSessionParams {
  modelId: string
  modelTitle: string
  price: number
  sellerId: string
  buyerId: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: params.modelTitle,
            description: `3Dモデル: ${params.modelTitle}`,
          },
          unit_amount: params.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      modelId: params.modelId,
      sellerId: params.sellerId,
      buyerId: params.buyerId,
    },
    payment_intent_data: {
      // 販売者への送金設定（Stripe Connect必要）
      application_fee_amount: Math.floor(params.price * 0.1), // 10%の手数料
    },
  })

  return session
}

export async function createTipSession(params: {
  recipientId: string
  recipientName: string
  amount: number
  tipperId: string
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `${params.recipientName}への投げ銭`,
            description: 'クリエイターを応援',
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      type: 'tip',
      recipientId: params.recipientId,
      tipperId: params.tipperId,
    },
  })

  return session
}

export async function createSubscription(params: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.customerId,
  })

  return session
}

export async function handleWebhook(
  body: string,
  signature: string,
  webhookSecret: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    throw new Error(`Webhook signature verification failed`)
  }

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.metadata?.type === 'tip') {
        // 投げ銭の処理
        await processTip(session)
      } else if (session.metadata?.modelId) {
        // モデル購入の処理
        await processPurchase(session)
      }
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // サブスクリプション処理
      const subscription = event.data.object as Stripe.Subscription
      await updateSubscription(subscription)
      break

    case 'customer.subscription.deleted':
      // サブスクリプション解約処理
      const canceledSubscription = event.data.object as Stripe.Subscription
      await cancelSubscription(canceledSubscription)
      break
  }

  return { received: true }
}

async function processPurchase(session: Stripe.Checkout.Session) {
  // データベースに購入記録を保存
  const { modelId, sellerId, buyerId } = session.metadata!
  
  // Supabaseに記録
  // await supabase.from('downloads').insert({...})
  // await supabase.from('transactions').insert({...})
}

async function processTip(session: Stripe.Checkout.Session) {
  // 投げ銭の記録
  const { recipientId, tipperId } = session.metadata!
  
  // Supabaseに記録
  // await supabase.from('transactions').insert({...})
}

async function updateSubscription(subscription: Stripe.Subscription) {
  // サブスクリプション更新
  // await supabase.from('profiles').update({...})
}

async function cancelSubscription(subscription: Stripe.Subscription) {
  // サブスクリプション解約処理
  // await supabase.from('profiles').update({...})
}