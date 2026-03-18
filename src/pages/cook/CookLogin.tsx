import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2 } from "lucide-react";

const CookLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateError = (location.state as any)?.error || "";
  const [error, setError] = useState(stateError);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/cook/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/cook/dashboard",
    });
    if (error) setError(error.message || "Google sign-in failed");
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setSending(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/cook/dashboard" },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />

      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
        <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
          Welcome back, Cooq
        </h1>
        <p className="font-body text-sm text-center mb-6" style={{ color: "rgba(249,247,242,0.6)" }}>
          Sign in to your cook dashboard
        </p>

        {error && (
          <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{error}</p>
        )}

        {otpSent ? (
          <p className="font-body text-sm text-center py-4" style={{ color: "#86A383" }}>
            Check your email for a sign-in link
          </p>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-lg font-body font-semibold text-sm transition-colors flex items-center justify-center gap-3"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity=".7"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".7"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".7"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".7"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(249,247,242,0.15)" }} />
              <span className="font-body text-xs" style={{ color: "rgba(249,247,242,0.4)" }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(249,247,242,0.15)" }} />
            </div>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-4 rounded-lg font-body text-sm mb-3 border-0 outline-none"
              style={{ backgroundColor: "rgba(249,247,242,0.08)", color: "#F9F7F2" }}
            />
            <button
              onClick={handleMagicLink}
              disabled={sending || !email}
              className="w-full py-3.5 rounded-lg font-body font-semibold text-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "rgba(249,247,242,0.1)", color: "#F9F7F2" }}
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send magic link
            </button>
          </>
        )}
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
