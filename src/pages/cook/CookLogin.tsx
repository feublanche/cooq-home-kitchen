import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2 } from "lucide-react";
import OtpInput from "@/components/OtpInput";

const CookLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateError = (location.state as any)?.error || "";

  const [screen, setScreen] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(stateError);
  const [checkingSession, setCheckingSession] = useState(true);
  const hasRedirected = useRef(false);

  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: cook } = await supabase
          .from("cooks").select("id").eq("user_id", session.user.id).maybeSingle();
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

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email"); return; }
    setError("");
    setLoading(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (otpErr) { setError(otpErr.message); return; }
    setScreen("otp");
  };

  const handleVerify = async (token: string) => {
    setOtpError("");
    setVerifying(true);
    const { data, error: verErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    setVerifying(false);
    if (verErr) {
      setOtpError("That code is incorrect. Try again or resend.");
      setCode("");
      return;
    }
    if (data.user?.app_metadata?.role === "operator") {
      navigate("/admin", { replace: true });
      return;
    }
    navigate("/cook/dashboard", { replace: true });
  };

  const handleResend = async () => {
    setOtpError("");
    setCode("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    if (err) setOtpError(err.message);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  if (screen === "otp") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8" />
        <div className="w-full max-w-sm rounded-2xl p-6 bg-card border border-gray-100">
          <h1 className="font-display italic text-2xl text-center mb-1 text-foreground">
            Enter your code
          </h1>
          <p className="font-body text-xs text-center mb-6 text-muted-foreground">
            We sent a 6-digit code to <span style={{ color: "#86A383" }}>{email}</span>. Check your inbox.
          </p>

          <OtpInput value={code} onChange={setCode} onComplete={handleVerify} error={!!otpError} />

          {otpError && <p className="font-body text-sm text-red-500 text-center mt-3">{otpError}</p>}
          {verifying && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#86A383" }} />
            </div>
          )}

          <button
            onClick={() => handleVerify(code)}
            disabled={verifying || code.length < 6}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 disabled:opacity-50"
            style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
          >
            {verifying ? "Verifying..." : "Verify"}
          </button>

          <button onClick={handleResend} className="font-body text-xs mt-4 block mx-auto hover:underline text-muted-foreground">
            Didn't get it? Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8" />
      <div className="w-full max-w-sm rounded-2xl p-6 bg-card border border-gray-100">
        <h1 className="font-display italic text-2xl text-center mb-1 text-foreground">
          Welcome back
        </h1>
        <p className="font-body text-xs text-center mb-6 text-muted-foreground">
          Enter your email — we'll send you a 6-digit code
        </p>

        {error && (
          <p className="font-body text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
        )}

        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full py-3 px-4 rounded-xl font-body text-sm border border-gray-200 bg-white text-foreground outline-none focus:ring-1 focus:ring-primary"
        />

        <button
          onClick={handleSendCode} disabled={loading}
          className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send my code →
        </button>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="font-body text-[13px] font-semibold mb-1 text-foreground">
            New cook?
          </p>
          <button onClick={() => navigate("/cook/signup")} className="font-body text-sm underline" style={{ color: "#86A383" }}>
            Apply here →
          </button>
        </div>
      </div>

      <p className="font-body text-xs mt-6 text-muted-foreground">
        Need help? Email{" "}
        <a href="mailto:hello@cooq.ae" className="underline">hello@cooq.ae</a>
      </p>
    </div>
  );
};

export default CookLogin;
