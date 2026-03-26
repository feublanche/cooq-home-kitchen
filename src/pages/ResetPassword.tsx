import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase sends recovery tokens via URL hash fragments
    // The JS client auto-detects them and sets the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (in case event fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in both fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/cook/login", { replace: true }), 2000);
  };

  const inputStyle =
    "w-full py-3 px-4 rounded-xl font-body text-sm border outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#2D312E" }}
    >
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />

      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "rgba(249,247,242,0.05)" }}
      >
        <h1
          className="font-display italic text-2xl text-center mb-1"
          style={{ color: "#F9F7F2" }}
        >
          Set new password
        </h1>
        <p
          className="font-body text-xs text-center mb-6"
          style={{ color: "rgba(249,247,242,0.5)" }}
        >
          Enter your new password below
        </p>

        {error && (
          <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">
            {error}
          </p>
        )}

        {success ? (
          <div className="text-center py-6">
            <p className="font-body text-sm mb-2" style={{ color: "#86A383" }}>
              Password updated successfully!
            </p>
            <p
              className="font-body text-xs"
              style={{ color: "rgba(249,247,242,0.5)" }}
            >
              Redirecting to login…
            </p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "#86A383" }}
            />
            <p
              className="font-body text-xs"
              style={{ color: "rgba(249,247,242,0.5)" }}
            >
              Verifying reset link…
            </p>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyle}
              style={{
                backgroundColor: "rgba(249,247,242,0.06)",
                color: "#F9F7F2",
                borderColor: "rgba(134,163,131,0.25)",
              }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputStyle} mt-3`}
              style={{
                backgroundColor: "rgba(249,247,242,0.06)",
                color: "#F9F7F2",
                borderColor: "rgba(134,163,131,0.25)",
              }}
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-4 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update password
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
