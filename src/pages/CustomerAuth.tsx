import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";

const CustomerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || "/my-bookings";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
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

  const handleMagicLink = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Check your email for a sign-in link");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Reset link sent to your email");
  };

  const handleSignUp = async () => {
    setError("");
    setInfo("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Check your email to verify your account, then sign in above.");
    setTab("signin");
  };

  return (
    <div className="bg-[#F9F7F2] min-h-screen max-w-[430px] mx-auto px-4">
      <div className="flex justify-center pt-8 mb-4">
        <img src={cooqLogo} alt="Cooq" className="h-8" />
      </div>
      <h2 className="font-display italic text-xl text-center text-foreground mb-1">Save your cook</h2>
      <p className="font-body text-sm text-center text-muted-foreground mb-6">Sign in to confirm your booking — takes 30 seconds.</p>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => {
            setTab("signin");
            setError("");
            setInfo("");
          }}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
            tab === "signin" ? "border-b-2 border-[#B57E5D] text-[#2D312E]" : "text-gray-400"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setTab("signup");
            setError("");
            setInfo("");
          }}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
            tab === "signup" ? "border-b-2 border-[#B57E5D] text-[#2D312E]" : "text-gray-400"
          }`}
        >
          Create Account
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {info && <p className="text-sm text-[#86A383] mb-4">{info}</p>}

      {tab === "signin" ? (
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="bg-[#B57E5D] text-white rounded-xl py-4 w-full font-semibold text-sm disabled:opacity-40 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button onClick={handleForgotPassword} className="text-[12px] text-gray-400 w-full text-center">
            Forgot password?
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleMagicLink}
            disabled={loading || !email}
            className="border border-gray-200 rounded-xl py-3 w-full text-sm text-gray-600 disabled:opacity-40"
          >
            Send me a sign-in link
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#B57E5D]"
          />
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-[#86A383] underline">
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-[#86A383] underline">
                Privacy Policy
              </a>
            </span>
          </label>
          <button
            onClick={handleSignUp}
            disabled={
              loading || !agreedToTerms || !email || !name || password.length < 8 || password !== confirmPassword
            }
            className="bg-[#B57E5D] text-white rounded-xl py-4 w-full font-semibold text-sm disabled:opacity-40 transition-opacity"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerAuth;
