import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export async function routeAfterAuth(navigate: NavigateFunction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cook } = await supabase
    .from("cooks")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cook) {
    navigate("/cook/dashboard", { replace: true });
  } else {
    navigate("/admin", { replace: true });
  }
}
