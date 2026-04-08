import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};



serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only operator can send notifications
    const callerEmail = claimsData.claims.email as string;
    if (callerEmail !== OPERATOR_EMAIL) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cook_name, cook_email, cook_phone, event_type, booking_details } = await req.json();

    const results: Record<string, string> = {};

    // Email notification via Lovable AI
    if (cook_email) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        results.email = 'skipped - no API key';
      } else {
        console.log(`[EMAIL] To: ${cook_email}, Event: ${event_type}, Cook: ${cook_name}`);
        console.log(`[EMAIL] Details:`, JSON.stringify(booking_details));
        results.email = 'logged';
      }
    }

    // WhatsApp notification placeholder
    if (cook_phone) {
      console.log(`[WHATSAPP] To: ${cook_phone}, Event: ${event_type}, Cook: ${cook_name}`);
      
      let message = '';
      switch (event_type) {
        case 'booking_confirmed':
          message = `Hi ${cook_name}! Your booking for ${booking_details?.menu} on ${booking_details?.date} has been confirmed. Client: ${booking_details?.customer_name}, Area: ${booking_details?.area}.`;
          break;
        case 'menu_approved':
          message = `Hi ${cook_name}! Your menu "${booking_details?.menu}" has been approved by the Cooq team. You're all set!`;
          break;
        case 'menu_rejected':
          message = `Hi ${cook_name}, your menu "${booking_details?.menu}" needs revision. Please update and resubmit. Reason: ${booking_details?.reason || 'See dashboard for details'}.`;
          break;
        case 'photo_reminder':
          message = `Hi ${cook_name}! Don't forget to upload your Proof of Quality photos (containers + kitchen) after your session today.`;
          break;
        default:
          message = `Hi ${cook_name}, you have a new notification from Cooq. Please check your dashboard.`;
      }

      console.log(`[WHATSAPP] Message: ${message}`);
      results.whatsapp = 'logged_pending_setup';
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in notify-cook:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
