import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Events that cooks can trigger themselves (no operator auth required)
const COOK_EVENTS = ['cook_signup', 'menu_submitted', 'document_uploaded'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cook_name, cook_email, cook_phone, event_type, booking_details } = await req.json();

    // For cook-originated events, just verify they're authenticated
    if (!COOK_EVENTS.includes(event_type)) {
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

      const appMetadata = claimsData.claims.app_metadata as Record<string, unknown> | undefined;
      if (appMetadata?.role !== 'operator') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const results: Record<string, string> = {};

    // Log notification for operator
    const operatorEmail = 'cooqdubai@gmail.com';
    console.log(`[NOTIFY] To: ${operatorEmail}, Event: ${event_type}, Cook: ${cook_name} (${cook_email})`);
    console.log(`[NOTIFY] Details:`, JSON.stringify(booking_details));

    // WhatsApp notification placeholder
    if (cook_phone) {
      let message = '';
      switch (event_type) {
        case 'cook_signup':
          message = `New cook application: ${cook_name} (${cook_email}, ${cook_phone}). Cuisines: ${booking_details?.cuisines}. Areas: ${booking_details?.areas}. Review in admin panel.`;
          break;
        case 'menu_submitted':
          message = `Cook ${cook_name} submitted a new ${booking_details?.cuisine} menu called "${booking_details?.menu}". Review in admin panel.`;
          break;
        case 'document_uploaded':
          message = `Cook ${cook_name} uploaded ${booking_details?.document_type}. Review in admin panel.`;
          break;
        case 'booking_confirmed':
          message = `Hi ${cook_name}! Your booking for ${booking_details?.menu} on ${booking_details?.date} has been confirmed.`;
          break;
        default:
          message = `Notification for ${cook_name}: ${event_type}`;
      }
      console.log(`[WHATSAPP] Message: ${message}`);
      results.whatsapp = 'logged_pending_setup';
    }

    results.email = 'logged';

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
