import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const OPERATOR_EMAIL = "cooqdubai@gmail.com";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        setChecking(false);
        return;
      }

      // Only the operator email can access /admin
      if (session.user.email !== OPERATOR_EMAIL) {
        // Check if they're a cook — redirect accordingly
        const { data: cook } = await supabase
          .from("cooks")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (cook) {
          navigate("/cook/dashboard", { replace: true });
        } else {
          await supabase.auth.signOut();
          navigate("/login", { replace: true });
        }
        setChecking(false);
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthorized(false);
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default ProtectedRoute;
