import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2, ArrowLeft } from "lucide-react";

const CustomerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/";

  const [screen, setScreen] = useState<"email" | "signup" | "waiting">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const savedBookingState = sessionStorage.getItem("cooq_pending_booking");
        if (savedBookingState) {
          sessionStorage.removeItem("cooq_pending_booking");
          navigate("/book", { replace: true, state: JSON.parse(savedBookingState) });
        } else {
          navigate(returnTo, { replace: true });
        }
      }
    });
  }, []);

  // Listen for magic link sign-in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const savedBookingState = sessionStorage.getItem("cooq_pending_booking");
        if (savedBookingState) {
          sessionStorage.removeItem("cooq_pending_booking");
          navigate("/book", { replace: true, state: JSON.parse(savedBookingState) });
        } else {
          navigate(returnTo, { replace: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const handleEmailContinue = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email"); return; }
    setError("");
    setLoading(true);

    // Try signing in existing user first (shouldCreateUser: false)
    const { error: signInErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    if (signInErr) {
      // User doesn't exist — show signup form
      setScreen("signup");
      setLoading(false);
      return;
    }

    // Existing user — link sent
    setScreen("waiting");
    setLoading(false);
  };

  const handleSignup = async () => {
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
    setScreen("waiting");
  };

  const inputClass = "border border-gray-200 rounded-xl px-4 py-3 w-full text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground";

  if (screen === "waiting") {
    return (
      <div className="bg-[hsl(var(--background))] min-h-screen max-w-[430px] mx-auto px-4">
        <div className="flex justify-center pt-8 mb-4">
          <img src={cooqLogo} alt="Cooq" className="h-8" />
        </div>
        <button onClick={() => setScreen("email")} className="flex items-center gap-1 font-body text-xs mb-4 text-primary">
          <ArrowLeft className="w-4 h-4" /> Change email
        </button>
        <h2 className="font-display italic text-xl text-center text-foreground mb-1">Check your email</h2>
        <p className="font-body text-sm text-center text-muted-foreground mb-8">
          We sent a sign-in link to <span className="font-semibold text-foreground">{email}</span>. Click the link in your email to continue.
        </p>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="font-body text-xs text-center text-muted-foreground mt-4">Waiting for you to click the link...</p>
        <button onClick={handleEmailContinue} className="text-xs text-muted-foreground w-full text-center mt-4 hover:underline">
          Didn't get it? Resend link
        </button>
      </div>
    );
  }

  if (screen === "signup") {
    return (
      <div className="bg-[hsl(var(--background))] min-h-screen max-w-[430px] mx-auto px-4">
        <div className="flex justify-center pt-8 mb-4">
          <img src={cooqLogo} alt="Cooq" className="h-8" />
        </div>
        <button onClick={() => setScreen("email")} className="flex items-center gap-1 font-body text-xs mb-4 text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="font-display italic text-2xl text-center text-foreground mb-1">Create your account</h2>
        <p className="font-body text-sm text-center text-muted-foreground mb-6">
          Just a few details to get started
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-3">
          <input
            type="text" placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)} className={inputClass}
          />
          <input
            type="email" placeholder="Email" value={email} readOnly
            className={`${inputClass} bg-muted`}
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
          onClick={handleSignup} disabled={loading}
          className="bg-accent text-accent-foreground rounded-xl py-4 w-full font-semibold text-sm mt-6 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Account →
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline text-primary">Terms</a>{" "}
          &amp;{" "}
          <a href="/privacy" className="underline text-primary">Privacy Policy</a>
        </p>
      </div>
    );
  }

  // Default: email-only screen
  return (
    <div className="bg-[hsl(var(--background))] min-h-screen max-w-[430px] mx-auto px-4">
      <div className="flex justify-center pt-8 mb-4">
        <img src={cooqLogo} alt="Cooq" className="h-8" />
      </div>
      <h2 className="font-display italic text-2xl text-center text-foreground mb-1">Welcome to Cooq</h2>
      <p className="font-body text-sm text-center text-muted-foreground mb-6">
        Enter your email to sign in or create an account
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputClass}
        />
      </div>

      <button
        onClick={handleEmailContinue} disabled={loading}
        className="bg-accent text-accent-foreground rounded-xl py-4 w-full font-semibold text-sm mt-6 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Continue →
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
