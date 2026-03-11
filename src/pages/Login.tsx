import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/my-bookings";

  const [mode, setMode] = useState<"choose" | "otp-email" | "otp-verify">("choose");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) setError(error.message || "Google sign-in failed");
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSuccess("Check your email for the verification code.");
      setMode("otp-verify");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError("Enter the code from your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      navigate(returnTo);
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="flex-1 px-6 pb-6 flex flex-col items-center justify-center">
        <h1 className="font-display italic text-3xl text-foreground mb-2">
          {mode === "choose" ? "Sign In" : mode === "otp-email" ? "Email OTP" : "Verify Code"}
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-8 text-center max-w-xs">
          {mode === "choose"
            ? "Sign in to track your bookings and manage your cook schedule."
            : mode === "otp-email"
            ? "We'll send a one-time code to your email."
            : `Enter the code sent to ${email}`}
        </p>

        {error && (
          <p className="font-body text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4 w-full max-w-sm">
            {error}
          </p>
        )}
        {success && (
          <p className="font-body text-sm text-primary bg-primary/10 rounded-lg p-3 mb-4 w-full max-w-sm">
            {success}
          </p>
        )}

        {mode === "choose" && (
          <div className="w-full max-w-sm space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 rounded-lg border border-border bg-card font-body font-semibold text-base text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Email OTP */}
            <button
              onClick={() => { setMode("otp-email"); setError(""); setSuccess(""); }}
              className="w-full py-4 rounded-lg border border-border bg-card font-body font-semibold text-base text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Mail className="w-5 h-5" />
              Continue with Email OTP
            </button>

            {/* Facebook placeholder - not supported */}
            <button
              disabled
              className="w-full py-4 rounded-lg border border-border bg-muted font-body font-medium text-sm text-muted-foreground flex items-center justify-center gap-3 cursor-not-allowed"
            >
              <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook (coming soon)
            </button>
          </div>
        )}

        {mode === "otp-email" && (
          <div className="w-full max-w-sm space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
            >
              {loading ? "Sending..." : "Send Code →"}
            </button>
            <button
              onClick={() => { setMode("choose"); setError(""); setSuccess(""); }}
              className="w-full font-body text-sm text-copper font-medium"
            >
              ← Back
            </button>
          </div>
        )}

        {mode === "otp-verify" && (
          <div className="w-full max-w-sm space-y-4">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
            >
              {loading ? "Verifying..." : "Verify & Sign In →"}
            </button>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full font-body text-sm text-copper font-medium"
            >
              Resend code
            </button>
            <button
              onClick={() => { setMode("otp-email"); setError(""); setSuccess(""); setOtpCode(""); }}
              className="w-full font-body text-sm text-muted-foreground"
            >
              ← Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
