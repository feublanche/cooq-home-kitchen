import { useEffect, useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CookRow, CookContext } from "@/context/CookContext";
import { Loader2 } from "lucide-react";

const CookProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [cook, setCook] = useState<CookRow | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigate("/cook/login", { replace: true });
        }
        return;
      }

      const { data, error } = await supabase
        .from("cooks")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigate("/cook/login", {
            replace: true,
            state: { error: "Cook account not found. Contact cooqdubai@gmail.com" },
          });
        }
        return;
      }

      const cookData = data as unknown as CookRow;
      setCook(cookData);
      setLoading(false);
      setChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !hasRedirected.current) {
        hasRedirected.current = true;
        setCook(null);
        navigate("/cook/login", { replace: true });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  return (
    <CookContext.Provider value={{ cook, setCook, loading }}>
      {children}
    </CookContext.Provider>
  );
};

export default CookProtectedRoute;
