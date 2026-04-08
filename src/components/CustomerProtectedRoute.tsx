import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CustomerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/account", { state: { returnTo: location.pathname }, replace: true });
        return;
      }
      if (session.user.app_metadata?.role === "operator") {
        navigate("/admin", { replace: true });
        return;
      }
      const { data: cookRecord } = await supabase
        .from("cooks")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cookRecord) {
        navigate("/cook/dashboard", { replace: true });
        return;
      }
      setReady(true);
    };
    check();
  }, [navigate, location.pathname]);

  if (!ready) return null;
  return <>{children}</>;
};

export default CustomerProtectedRoute;
