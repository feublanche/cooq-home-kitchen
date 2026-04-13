import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2 } from "lucide-react";
import OtpInput from "@/components/OtpInput";

const CustomerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/";

  const [screen, setScreen] = useState<"collect" | "otp">("collect");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP screen
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email"); return; }
    setError("");
    setLoading(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { full_name: name.trim(), phone: phone.trim() || undefined },
      },
    });
    setLoading(false);
    if (otpErr) { setError(otpErr.message); return; }
    setScreen("otp");
  };

  const handleVerify = async (token: string) => {
    setOtpError("");
    setVerifying(true);
    const { error: verErr } = await supabase.auth.verifyOtp({
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
    const savedBookingState = sessionStorage.getItem("cooq_pending_booking");
    if (savedBookingState) {
      sessionStorage.removeItem("cooq_pending_booking");
      navigate("/book", { replace: true, state: JSON.parse(savedBookingState) });
    } else {
      navigate(returnTo, { replace: true });
    }
  };

  const handleResend = async () => {
    setOtpError("");
    setCode("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { full_name: name.trim(), phone: phone.trim() || undefined } },
    });
    if (err) setOtpError(err.message);
  };

  const inputClass = "border border-gray-200 rounded-xl px-4 py-3 w-full text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground";

  if (screen === "otp") {
    return (
      <div className="bg-[hsl(var(--background))] min-h-screen max-w-[430px] mx-auto px-4">
        <div className="flex justify-center pt-8 mb-4">
          <img src={cooqLogo} alt="Cooq" className="h-8" />
        </div>
        <h2 className="font-display italic text-xl text-center text-foreground mb-1">Enter your code</h2>
        <p className="font-body text-sm text-center text-muted-foreground mb-8">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. Check your inbox.
        </p>

        <OtpInput value={code} onChange={setCode} onComplete={handleVerify} error={!!otpError} />

        {otpError && <p className="text-sm text-red-600 text-center mt-3">{otpError}</p>}
        {verifying && (
          <div className="flex justify-center mt-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        <button
          onClick={() => handleVerify(code)}
          disabled={verifying || code.length < 6}
          className="bg-accent text-accent-foreground rounded-xl py-4 w-full font-semibold text-sm mt-6 disabled:opacity-40 transition-opacity"
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>

        <button onClick={handleResend} className="text-xs text-muted-foreground w-full text-center mt-4 hover:underline">
          Didn't get it? Resend code
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--background))] min-h-screen max-w-[430px] mx-auto px-4">
      <div className="flex justify-center pt-8 mb-4">
        <img src={cooqLogo} alt="Cooq" className="h-8" />
      </div>
      <h2 className="font-display italic text-2xl text-center text-foreground mb-1">Welcome to Cooq</h2>
      <p className="font-body text-sm text-center text-muted-foreground mb-6">
        Enter your email — we'll send you a 6-digit code
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        <input
          type="text" placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass}
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputClass}
        />
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-3 bg-white text-sm font-body text-foreground shrink-0">
            <span>🇦🇪</span><span>+971</span>
          </div>
          <input
            type="tel" placeholder="Phone number" value={phone}
            onChange={(e) => setPhone(e.target.value)} className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={handleSendCode} disabled={loading}
        className="bg-accent text-accent-foreground rounded-xl py-4 w-full font-semibold text-sm mt-6 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Send my code →
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline text-primary">Terms</a>{" "}
        &amp;{" "}
        <a href="/privacy" className="underline text-primary">Privacy Policy</a>
      </p>
    </div>
  );
};

export default CustomerAuth;
