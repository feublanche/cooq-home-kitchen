import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2 } from "lucide-react";

const CookLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateError = (location.state as any)?.error || "";
  const [error, setError] = useState(stateError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const hasRedirected = useRef(false);

  // On mount: check if already logged in as a cook
  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: cook } = await supabase
          .from("cooks")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (cook && !hasRedirected.current) {
          hasRedirected.current = true;
          navigate("/cook/dashboard", { replace: true });
          return;
        }
      }
      setCheckingSession(false);
    };
    checkExisting();
  }, [navigate]);

  const handleSignIn = async () => {
    const emailVal = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim();
    const passwordVal = (document.querySelector('input[type="password"]') as HTMLInputElement)?.value?.trim();
    if (!emailVal || !passwordVal) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailVal,
        password: passwordVal,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user.app_metadata?.role === "operator") {
        navigate("/admin", { replace: true });
        return;
      }
      const { data: cook } = await supabase
        .from("cooks").select("id,status").eq("user_id", data.user.id).maybeSingle();
      if (cook) {
        navigate("/cook/dashboard", { replace: true });
      } else {
        setError("No cook account found. Email hello@cooq.ae");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "Sign in failed");
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setMagicLinkLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/cook/login" },
    });
    setMagicLinkLoading(false);
    if (error) setError(error.message);
    else setMagicLinkSent(true);
  };


  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) setError(error.message);
    else setResetSent(true);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#2D312E" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  const inputStyle = "w-full py-3 px-4 rounded-xl font-body text-sm border-0 outline-none focus:ring-1 focus:ring-[#86A383]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />

      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
        <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
          Welcome back, Cooq
        </h1>
        <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
          Sign in to your cook dashboard
        </p>

        {error && (
          <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{error}</p>
        )}
        {resetSent && (
          <p className="font-body text-sm text-center py-2 mb-3" style={{ color: "#86A383" }}>
            Reset link sent to your email
          </p>
        )}

        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className={inputStyle}
          style={{ backgroundColor: "rgba(249,247,242,0.06)", color: "#F9F7F2", borderColor: "rgba(134,163,131,0.25)", borderWidth: 1 }}
        />
        <input
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className={`${inputStyle} mt-3`}
          style={{ backgroundColor: "rgba(249,247,242,0.06)", color: "#F9F7F2", borderColor: "rgba(134,163,131,0.25)", borderWidth: 1 }}
        />
        <button onClick={handleForgotPassword} className="font-body text-xs mt-2 mb-4 block" style={{ color: "rgba(249,247,242,0.4)" }}>
          Forgot password?
        </button>
        <button
          onClick={handleSignIn} disabled={loading}
          className="w-full py-3 rounded-xl font-body font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(249,247,242,0.15)" }} />
          <span className="font-body text-xs" style={{ color: "rgba(249,247,242,0.4)" }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(249,247,242,0.15)" }} />
        </div>

        {magicLinkSent ? (
          <p className="font-body text-sm text-center py-4" style={{ color: "#86A383" }}>
            Check your email for a sign-in link
          </p>
        ) : (
          <button
            onClick={handleMagicLink} disabled={magicLinkLoading || !email}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "transparent", color: "#86A383", border: "1px solid rgba(134,163,131,0.4)" }}
          >
            {magicLinkLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send magic link
          </button>
        )}


        {/* Apply to cook */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(249,247,242,0.1)" }}>
          <p className="font-body text-[13px] font-semibold mb-1" style={{ color: "#F9F7F2" }}>
            Don't have an account?
          </p>
          <button
            onClick={() => navigate("/cook/signup")}
            className="font-body text-sm underline"
            style={{ color: "#86A383" }}
          >
            Apply to cook →
          </button>
        </div>
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "rgba(249,247,242,0.4)" }}>
        Need help? Email{" "}
        <a href="mailto:hello@cooq.ae" className="underline" style={{ color: "rgba(249,247,242,0.6)" }}>
          hello@cooq.ae
        </a>
      </p>
    </div>
  );
};

export default CookLogin;
