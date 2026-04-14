import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OPERATOR_EMAIL = 'admin.cooq@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, details } = await req.json();

    let subject = '';
    let body = '';

    switch (event_type) {
      case 'cook_signup':
        subject = `New cook application: ${details.name}`;
        body = `New cook application: ${details.name} (${details.email}) — review in Supply Manager tab.`;
        break;
      case 'document_uploaded':
        subject = `Cook ${details.cook_name} uploaded ${details.document_type}`;
        body = `Cook ${details.cook_name} uploaded ${details.document_type} — review in Supply Manager tab.`;
        break;
      case 'menu_submitted':
        subject = `Cook ${details.cook_name} submitted menu '${details.menu_name}'`;
        body = `Cook ${details.cook_name} submitted menu '${details.menu_name}' — review in Menu Vetting tab.`;
        break;
      case 'menu_resubmitted':
        subject = `Cook ${details.cook_name} resubmitted menu '${details.menu_name}'`;
        body = `Cook ${details.cook_name} resubmitted menu '${details.menu_name}' — review in Menu Vetting tab.`;
        break;
      case 'profile_updated':
        subject = `Cook ${details.cook_name} updated their profile`;
        body = `Cook ${details.cook_name} updated their profile — review in Supply Manager tab.`;
        break;
      case 'new_booking':
        subject = `New booking: ${details.customer_name} booked ${details.cook_name}`;
        body = `New booking: ${details.customer_name} booked ${details.cook_name} for ${details.date} · ${details.tier} · ${details.menu_name}. View in admin panel.`;
        break;
      case 'proof_uploaded':
        subject = `Cook ${details.cook_name} uploaded proof for session ${details.date}`;
        body = `Cook ${details.cook_name} uploaded proof for session ${details.date} — review in Quality Audit tab.`;
        break;
      case 'proof_resubmitted':
        subject = `Cook ${details.cook_name} resubmitted proof for session ${details.date}`;
        body = `Cook ${details.cook_name} resubmitted proof for session ${details.date} — review in Quality Audit tab.`;
        break;
      default:
        subject = `Cooq notification: ${event_type}`;
        body = `Event: ${event_type}. Details: ${JSON.stringify(details)}`;
    }

    // Log for now - email delivery can be wired up with transactional email infra
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
