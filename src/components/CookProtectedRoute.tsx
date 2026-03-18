import { useEffect, useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CookRow, CookContext } from "@/context/CookContext";
import { Loader2, LogOut } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const CookProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [cook, setCook] = useState<CookRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
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
        .single();

      if (cancelled) return;

      if (error || !data) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigate("/cook/login", {
            replace: true,
            state: { error: "Cook account not found. Contact hello@cooq.ae" },
          });
        }
        return;
      }

      const cookData = data as unknown as CookRow;

      if (cookData.status === "applied" || cookData.status === "reviewed") {
        setPendingApproval(true);
        setPendingEmail(cookData.email);
        setChecking(false);
        return;
      }

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#2D312E" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
          <h2 className="font-display italic text-xl mb-3" style={{ color: "#F9F7F2" }}>
            Account Pending Approval
          </h2>
          <p className="font-body text-sm mb-6" style={{ color: "rgba(249,247,242,0.6)" }}>
            Your account is pending approval. We'll notify you at{" "}
            <span style={{ color: "#86A383" }}>{pendingEmail}</span>{" "}
            when you're approved.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              hasRedirected.current = false;
              navigate("/cook/login", { replace: true });
            }}
            className="flex items-center gap-2 mx-auto font-body text-sm"
            style={{ color: "rgba(249,247,242,0.4)" }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
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
