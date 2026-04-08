import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export async function routeAfterAuth(navigate: NavigateFunction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const role = user.app_metadata?.role;
  if (role === "operator") {
    navigate("/admin", { replace: true });
    return;
  }

  const { data: cook } = await supabase
    .from("cooks")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (cook) {
    navigate("/cook/dashboard", { replace: true });
  } else {
    navigate("/admin", { replace: true });
  }
}
