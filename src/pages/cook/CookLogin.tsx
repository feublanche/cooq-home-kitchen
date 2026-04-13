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

  // OTP
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
    // Check if operator
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#2D312E" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  const inputStyle = "w-full py-3 px-4 rounded-xl font-body text-sm border-0 outline-none focus:ring-1 focus:ring-[#86A383]";

  if (screen === "otp") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />
        <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
          <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
            Enter your code
          </h1>
          <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
            We sent a 6-digit code to <span style={{ color: "#86A383" }}>{email}</span>. Check your inbox.
          </p>

          <OtpInput value={code} onChange={setCode} onComplete={handleVerify} error={!!otpError} dark />

          {otpError && <p className="font-body text-sm text-red-400 text-center mt-3">{otpError}</p>}
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

          <button onClick={handleResend} className="font-body text-xs mt-4 block mx-auto hover:underline" style={{ color: "rgba(249,247,242,0.4)" }}>
            Didn't get it? Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
        <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
          Welcome back
        </h1>
        <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
          Enter your email — we'll send you a 6-digit code
        </p>

        {error && (
          <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{error}</p>
        )}

        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyle}
          style={{ backgroundColor: "rgba(249,247,242,0.06)", color: "#F9F7F2", borderColor: "rgba(134,163,131,0.25)", borderWidth: 1 }}
        />

        <button
          onClick={handleSendCode} disabled={loading}
          className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send my code →
        </button>

        <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(249,247,242,0.1)" }}>
          <p className="font-body text-[13px] font-semibold mb-1" style={{ color: "#F9F7F2" }}>
            New cook?
          </p>
          <button onClick={() => navigate("/cook/signup")} className="font-body text-sm underline" style={{ color: "#86A383" }}>
            Apply here →
          </button>
        </div>
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "rgba(249,247,242,0.4)" }}>
        Need help? Email{" "}
        <a href="mailto:hello@cooq.ae" className="underline" style={{ color: "rgba(249,247,242,0.6)" }}>hello@cooq.ae</a>
      </p>
    </div>
  );
};

export default CookLogin;
