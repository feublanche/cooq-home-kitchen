import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import OtpInput from "@/components/OtpInput";

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican",
  "American", "Italian", "Keto", "Vegan",
];

const areaOptions = [
  "Downtown Dubai", "JBR", "Marina", "Jumeirah", "Mirdif", "Arabian Ranches",
  "Business Bay", "DIFC", "Al Barsha", "Palm Jumeirah", "Deira", "Bur Dubai",
];

const CookSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otpScreen, setOtpScreen] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState("");

  // OTP
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Step 2
  const [bio, setBio] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(249,247,242,0.06)",
    border: "1px solid rgba(134,163,131,0.25)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#F9F7F2",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  };

  const handleSendCode = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim() || !email.includes("@")) newErrors.email = "Valid email is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!agreed) newErrors.agreed = "Please agree to the cook terms";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { full_name: name.trim(), phone: phone.trim() },
      },
    });
    setLoading(false);
    if (otpErr) { setErrors({ general: otpErr.message }); return; }
    setOtpScreen(true);
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

    if (!data.user) {
      setOtpError("Verification failed. Try again.");
      return;
    }

    // Upsert cook row
    const { data: existing } = await supabase
      .from("cooks").select("id").eq("user_id", data.user.id).maybeSingle();

    if (!existing) {
      await supabase.from("cooks").insert({
        user_id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: "applied",
      } as any);
    }

    setUserId(data.user.id);
    setOtpScreen(false);
    setStep(2);
  };

  const handleResend = async () => {
    setOtpError("");
    setCode("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { full_name: name.trim(), phone: phone.trim() } },
    });
    if (err) setOtpError(err.message);
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Only JPG, PNG or WebP allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const handleSubmitProfile = async () => {
    if (!photoFile) { toast.error("Profile photo is required"); return; }
    if (cuisines.length === 0) { toast.error("Select at least one cuisine"); return; }
    if (areas.length === 0) { toast.error("Select at least one area"); return; }

    setSubmitting(true);
    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${userId}/profile.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("cook-photos").upload(path, photoFile, { upsert: true });
    if (uploadError) { toast.error("Photo upload failed: " + uploadError.message); setSubmitting(false); return; }
    const { data: urlData } = supabase.storage.from("cook-photos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("cooks")
      .update({
        bio: bio.trim() || null,
        cuisine: cuisines,
        area: areas.join(", "),
        years_experience: parseInt(experience) || 0,
        photo_url: urlData.publicUrl,
        status: "applied",
      } as any)
      .eq("user_id", userId);

    if (updateError) { toast.error("Profile update failed: " + updateError.message); setSubmitting(false); return; }
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8 brightness-0 invert" />
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(134,163,131,0.2)" }}>
            <Check className="w-6 h-6" style={{ color: "#86A383" }} />
          </div>
          <h2 className="font-display italic text-xl mb-3" style={{ color: "#F9F7F2" }}>Profile Submitted!</h2>
          <p className="font-body text-sm mb-6" style={{ color: "rgba(249,247,242,0.6)" }}>
            Your profile is under review. We'll WhatsApp you within 48 hours.
          </p>
          <button onClick={() => navigate("/cook/login")} className="w-full py-3 rounded-xl font-body font-semibold text-sm" style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // OTP screen for step 1
  if (otpScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#2D312E" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-6 brightness-0 invert" />
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "#86A383" }} />
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "rgba(249,247,242,0.15)" }} />
        </div>
        <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
          <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>Enter your code</h1>
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
            onClick={() => handleVerify(code)} disabled={verifying || code.length < 6}
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
    <div className="min-h-screen flex flex-col items-center px-6 py-8" style={{ backgroundColor: "#2D312E" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-6 brightness-0 invert" />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: step >= 1 ? "#86A383" : "rgba(249,247,242,0.15)" }} />
        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: step >= 2 ? "#86A383" : "rgba(249,247,242,0.15)" }} />
      </div>

      <div className="w-full max-w-sm">
        {step === 1 && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
            <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
              Apply to cook with Cooq
            </h1>
            <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
              Takes 2 minutes. We'll send a 6-digit code to verify your email.
            </p>

            {errors.general && (
              <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{errors.general}</p>
            )}

            <div className="space-y-3">
              <div>
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                {errors.name && <p className="font-body text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                {errors.email && <p className="font-body text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl px-3 py-3 shrink-0 font-body text-sm" style={{ backgroundColor: "rgba(249,247,242,0.06)", border: "1px solid rgba(134,163,131,0.25)", color: "#F9F7F2" }}>
                    <span>🇦🇪</span><span>+971</span>
                  </div>
                  <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                </div>
                {errors.phone && <p className="font-body text-xs text-red-400 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-[#86A383] mt-1" />
                  <span className="font-body text-xs" style={{ color: "rgba(249,247,242,0.6)" }}>
                    I agree to Cooq's{" "}
                    <a href="/cook-agreement" target="_blank" className="underline" style={{ color: "#86A383" }}>cook terms</a>
                  </span>
                </label>
                {errors.agreed && <p className="font-body text-xs text-red-400 mt-1">{errors.agreed}</p>}
              </div>
            </div>

            <button
              onClick={handleSendCode} disabled={loading}
              className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send my code →
            </button>

            <p className="font-body text-xs text-center mt-4" style={{ color: "rgba(249,247,242,0.4)" }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/cook/login")} className="underline" style={{ color: "#86A383" }}>Sign in</button>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
            <h1 className="font-display italic text-xl text-center mb-1" style={{ color: "#F9F7F2" }}>
              Complete Your Profile
            </h1>
            <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
              Step 2: Tell us about yourself
            </p>

            {/* Photo upload */}
            <div className="flex justify-center mb-6">
              <div
                className="w-24 h-24 rounded-full overflow-hidden cursor-pointer relative"
                style={photoPreview ? {} : { backgroundColor: "rgba(249,247,242,0.06)", border: "2px dashed rgba(134,163,131,0.4)" }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Camera className="w-6 h-6" style={{ color: "#86A383" }} />
                    <span className="font-body mt-1" style={{ fontSize: "9px", color: "rgba(249,247,242,0.5)" }}>Add photo *</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Short bio ({bio.length}/200)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} placeholder="Tell families what makes your cooking special..." rows={3} style={{ ...inputStyle, resize: "none" }} />
              </div>

              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "rgba(249,247,242,0.5)" }}>Cuisines you cook *</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((c) => {
                    const selected = cuisines.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggleChip(c, cuisines, setCuisines)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: selected ? "rgba(134,163,131,0.2)" : "rgba(249,247,242,0.06)", border: `1px solid ${selected ? "#86A383" : "rgba(134,163,131,0.2)"}`, color: selected ? "#86A383" : "rgba(249,247,242,0.5)" }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "rgba(249,247,242,0.5)" }}>Areas you can serve *</label>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((a) => {
                    const selected = areas.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleChip(a, areas, setAreas)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: selected ? "rgba(134,163,131,0.2)" : "rgba(249,247,242,0.06)", border: `1px solid ${selected ? "#86A383" : "rgba(134,163,131,0.2)"}`, color: selected ? "#86A383" : "rgba(249,247,242,0.5)" }}>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Years of cooking experience</label>
                <input type="number" min="0" max="50" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" style={inputStyle} />
              </div>
            </div>

            <button onClick={handleSubmitProfile} disabled={submitting} className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit for Review
            </button>
          </div>
        )}
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "rgba(249,247,242,0.4)" }}>
        Need help?{" "}
        <a href="mailto:hello@cooq.ae" className="underline" style={{ color: "rgba(249,247,242,0.6)" }}>hello@cooq.ae</a>
      </p>
    </div>
  );
};

export default CookSignup;
