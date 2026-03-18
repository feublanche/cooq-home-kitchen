import Stripe from 'https://esm.sh/stripe@14.21.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { amount_aed, booking_id, customer_email } = await req.json()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' })
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amount_aed * 100),
      currency: 'aed',
      metadata: { booking_id },
      receipt_email: customer_email,
      description: `Cooq session - ${booking_id}`,
    })
    return new Response(
      JSON.stringify({ clientSecret: pi.client_secret, paymentIntentId: pi.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
