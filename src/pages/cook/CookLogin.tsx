import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2, ArrowLeft } from "lucide-react";

const CookLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateError = (location.state as any)?.error || "";

  const [screen, setScreen] = useState<"email" | "waiting">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(stateError);
  const [checkingSession, setCheckingSession] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: cook } = await supabase
          .from("cooks").select("id").eq("user_id", session.user.id).maybeSingle();
        if (cook && !hasRedirected.current) {
          hasRedirected.current = true;
          navigate("/cook/dashboard");
          return;
        }
      }
      setCheckingSession(false);
    };
    checkExisting();
  }, [navigate]);

  // Listen for magic link sign-in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && screen === "waiting") {
        if (session.user?.app_metadata?.role === "operator") {
          navigate("/admin", { replace: true });
          return;
        }
        navigate("/cook/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, screen]);

  const handleSendLink = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email"); return; }
    setError("");
    setLoading(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://cooq-home-kitchen.lovable.app/cook/dashboard",
      },
    });
    setLoading(false);
    if (otpErr) { setError(otpErr.message); return; }
    setScreen("waiting");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  if (screen === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#FAF9F6" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8" />
        <div className="w-full max-w-sm rounded-2xl p-6 bg-white border border-gray-100">
          <button onClick={() => setScreen("email")} className="flex items-center gap-1 font-body text-xs mb-4" style={{ color: "#86A383" }}>
            <ArrowLeft className="w-4 h-4" /> Change email
          </button>
          <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#2C3B3A" }}>
            Check your email
          </h1>
          <p className="font-body text-xs text-center mb-6" style={{ color: "#999" }}>
            We sent a sign-in link to <span style={{ color: "#86A383" }}>{email}</span>. Click the link in your email to continue.
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#86A383" }} />
          </div>
          <p className="font-body text-xs text-center mt-4" style={{ color: "#999" }}>Waiting for you to click the link...</p>
          <button onClick={handleSendLink} className="font-body text-xs mt-4 block mx-auto hover:underline" style={{ color: "#999" }}>
            Didn't get it? Resend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#FAF9F6" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8" />
      <div className="w-full max-w-sm rounded-2xl p-6 bg-white border border-gray-100">
        <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#2C3B3A" }}>
          Welcome back
        </h1>
        <p className="font-body text-xs text-center mb-6" style={{ color: "#999" }}>
          Enter your email — we'll send you a sign-in link
        </p>

        {error && (
          <p className="font-body text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
        )}

        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full py-3 px-4 rounded-xl font-body text-sm border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-[#86A383]"
          style={{ color: "#2C3B3A" }}
        />

        <button
          onClick={handleSendLink} disabled={loading}
          className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send sign-in link →
        </button>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="font-body text-[13px] font-semibold mb-1" style={{ color: "#2C3B3A" }}>
            New cook?
          </p>
          <button onClick={() => navigate("/cook/signup")} className="font-body text-sm underline" style={{ color: "#86A383" }}>
            Apply here →
          </button>
        </div>
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "#999" }}>
        Need help? Email{" "}
        <a href="mailto:cooqdubai@gmail.com" className="underline">cooqdubai@gmail.com</a>
      </p>
    </div>
  );
};

export default CookLogin;
