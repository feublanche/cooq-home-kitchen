import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowLeft, Smartphone } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/my-bookings";

  const [mode, setMode] = useState<"choose" | "otp-phone" | "otp-verify">("choose");
  const [phone, setPhone] = useState("+971");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Listen for auth state changes (e.g. after Google OAuth redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate(returnTo);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) setError(error.message || "Google sign-in failed");
  };

  const handleSendPhoneOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) {
      setError("Please enter a valid phone number with country code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
      if (error) throw error;
      setSuccess("An SMS with a verification code has been sent to your phone.");
      setMode("otp-verify");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otpCode.trim() || otpCode.length < 6) {
      setError("Enter the 6-digit code from your SMS");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\s/g, ""),
        token: otpCode,
        type: "sms",
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
          {mode === "choose" ? "Sign In" : mode === "otp-phone" ? "Phone Verification" : "Verify Code"}
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-8 text-center max-w-xs">
          {mode === "choose"
            ? "Sign in to track your bookings and manage your cook schedule."
            : mode === "otp-phone"
            ? "We'll send a one-time code to your phone via SMS."
            : `Enter the code sent to ${phone}`}
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

            {/* Phone OTP */}
            <button
              onClick={() => { setMode("otp-phone"); setError(""); setSuccess(""); }}
              className="w-full py-4 rounded-lg border border-border bg-card font-body font-semibold text-base text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Smartphone className="w-5 h-5" />
              Continue with Phone OTP
            </button>
          </div>
        )}

        {mode === "otp-phone" && (
          <div className="w-full max-w-sm space-y-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="font-body text-xs text-muted-foreground">
              Enter your UAE mobile number with country code (+971)
            </p>
            <button
              onClick={handleSendPhoneOtp}
              disabled={loading}
              className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
            >
              {loading ? "Sending..." : "Send SMS Code →"}
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
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleVerifyPhoneOtp}
              disabled={loading}
              className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
            >
              {loading ? "Verifying..." : "Verify & Sign In →"}
            </button>
            <button
              onClick={handleSendPhoneOtp}
              disabled={loading}
              className="w-full font-body text-sm text-copper font-medium"
            >
              Resend code
            </button>
            <button
              onClick={() => { setMode("otp-phone"); setError(""); setSuccess(""); setOtpCode(""); }}
              className="w-full font-body text-sm text-muted-foreground"
            >
              ← Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
