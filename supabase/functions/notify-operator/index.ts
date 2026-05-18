import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OPERATOR_EMAIL = 'admin.cooq@gmail.com';

// Events any authenticated user (customer/cook) may legitimately trigger.
// All other events require operator role.
const USER_TRIGGERABLE_EVENTS = new Set([
  'cook_signup',
  'document_uploaded',
  'menu_submitted',
  'menu_resubmitted',
  'profile_updated',
  'new_booking',
  'proof_uploaded',
  'proof_resubmitted',
]);

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event_type, details } = await req.json();
    if (typeof event_type !== 'string' || event_type.length === 0 || event_type.length > 64) {
      return new Response(JSON.stringify({ error: 'Invalid event_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Non-user-triggerable events require operator role
    const claims = claimsData.claims as Record<string, unknown>;
    const appMeta = (claims.app_metadata ?? {}) as Record<string, unknown>;
    if (!USER_TRIGGERABLE_EVENTS.has(event_type) && appMeta.role !== 'operator') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = '';
    let body = '';

    switch (event_type) {
      case 'cook_signup':
        subject = `New cook application: ${details?.name}`;
        body = `New cook application: ${details?.name} (${details?.email}) — review in Supply Manager tab.`;
        break;
      case 'document_uploaded':
        subject = `Cook ${details?.cook_name} uploaded ${details?.document_type}`;
        body = `Cook ${details?.cook_name} uploaded ${details?.document_type} — review in Supply Manager tab.`;
        break;
      case 'menu_submitted':
        subject = `Cook ${details?.cook_name} submitted menu '${details?.menu_name}'`;
        body = `Cook ${details?.cook_name} submitted menu '${details?.menu_name}' — review in Menu Vetting tab.`;
        break;
      case 'menu_resubmitted':
        subject = `Cook ${details?.cook_name} resubmitted menu '${details?.menu_name}'`;
        body = `Cook ${details?.cook_name} resubmitted menu '${details?.menu_name}' — review in Menu Vetting tab.`;
        break;
      case 'profile_updated':
        subject = `Cook ${details?.cook_name} updated their profile`;
        body = `Cook ${details?.cook_name} updated their profile — review in Supply Manager tab.`;
        break;
      case 'new_booking':
        subject = `New booking: ${details?.customer_name} booked ${details?.cook_name}`;
        body = `New booking: ${details?.customer_name} booked ${details?.cook_name} for ${details?.date} · ${details?.tier} · ${details?.menu_name}. View in admin panel.`;
        break;
      case 'proof_uploaded':
        subject = `Cook ${details?.cook_name} uploaded proof for session ${details?.date}`;
        body = `Cook ${details?.cook_name} uploaded proof for session ${details?.date} — review in Quality Audit tab.`;
        break;
      case 'proof_resubmitted':
        subject = `Cook ${details?.cook_name} resubmitted proof for session ${details?.date}`;
        body = `Cook ${details?.cook_name} resubmitted proof for session ${details?.date} — review in Quality Audit tab.`;
        break;
      default:
        subject = `Cooq notification: ${event_type}`;
        body = `Event: ${event_type}. Details: ${JSON.stringify(details)}`;
    }

    console.log(`[OPERATOR EMAIL] To: ${OPERATOR_EMAIL}`);
    console.log(`[OPERATOR EMAIL] Subject: ${subject}`);
    console.log(`[OPERATOR EMAIL] Body: ${body}`);

    return new Response(JSON.stringify({ success: true, to: OPERATOR_EMAIL, subject }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in notify-operator:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
