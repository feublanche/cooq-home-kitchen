import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cook_name, cook_email, cook_phone, event_type, booking_details } = await req.json();

    const results: Record<string, string> = {};

    // Email notification via Lovable AI
    if (cook_email) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        results.email = 'skipped - no API key';
      } else {
        // For now, log the email intent — full email infra will be wired when domain is set up
        console.log(`[EMAIL] To: ${cook_email}, Event: ${event_type}, Cook: ${cook_name}`);
        console.log(`[EMAIL] Details:`, JSON.stringify(booking_details));
        results.email = 'logged';
      }
    }

    // WhatsApp notification placeholder
    // WhatsApp Business API requires Meta Business verification + approved message templates
    // This will be activated once WhatsApp Business is configured
    if (cook_phone) {
      console.log(`[WHATSAPP] To: ${cook_phone}, Event: ${event_type}, Cook: ${cook_name}`);
      
      // Build the message based on event type
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
