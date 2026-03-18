import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OPERATOR_EMAIL = "cooqdubai@gmail.com";

export async function routeAfterAuth(navigate: NavigateFunction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Operator always goes to admin regardless of cooks table
  if (user.email === OPERATOR_EMAIL) {
    navigate("/admin", { replace: true });
    return;
  }

  // Everyone else: check if they are a cook
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
