import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create the admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin.cooq@gmail.com",
      password: "Cooking2026$",
      email_confirm: true,
      app_metadata: { role: "operator" },
    });

    if (error) {
      // If user already exists, update their metadata
      if (error.message?.includes("already been registered")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find((u: any) => u.email === "admin.cooq@gmail.com");
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            app_metadata: { role: "operator" },
          });
          return new Response(JSON.stringify({ success: true, message: "User updated with operator role" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
