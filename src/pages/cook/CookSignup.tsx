import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2, Camera, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import OtpInput from "@/components/OtpInput";

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican",
  "American", "Italian", "Keto/Healthy", "Vegan", "Other",
];

const areaOptions = [
  "Dubai Marina", "JBR", "JLT", "Downtown Dubai", "Business Bay", "DIFC",
  "Jumeirah", "Umm Suqeim", "Al Barsha", "Arabian Ranches", "Mirdif",
  "Palm Jumeirah", "Deira/Bur Dubai", "All Dubai",
];

const experienceOptions = [
  "Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years",
];

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const [days, setDays] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full py-3 px-4 rounded-xl font-body text-sm border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-[#86A383]";

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
        status: "pending",
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

  const parseExperience = (val: string): number => {
    if (val === "Less than 1 year") return 0;
    if (val === "1–3 years") return 2;
    if (val === "3–5 years") return 4;
    if (val === "5–10 years") return 7;
    if (val === "10+ years") return 10;
    return 0;
  };

  const handleSubmitProfile = async () => {
    if (!bio.trim()) { toast.error("Please write a short bio"); return; }
    if (cuisines.length === 0) { toast.error("Select at least one cuisine"); return; }
    if (areas.length === 0) { toast.error("Select at least one area"); return; }
    if (!experience) { toast.error("Select your years of experience"); return; }

    setSubmitting(true);

    let photoUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${userId}/profile.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cook-photos").upload(path, photoFile, { upsert: true });
      if (uploadError) { toast.error("Photo upload failed: " + uploadError.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("cook-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    const updatePayload: any = {
      bio: bio.trim(),
      cuisine: cuisines,
      area: areas.join(", "),
      years_experience: parseExperience(experience),
      status: "pending",
    };
    if (photoUrl) updatePayload.photo_url = photoUrl;

    const { error: updateError } = await supabase
      .from("cooks")
      .update(updatePayload)
      .eq("user_id", userId);

    if (updateError) { toast.error("Profile update failed: " + updateError.message); setSubmitting(false); return; }

    // Trigger notification to operator
    try {
      await supabase.functions.invoke("notify-cook", {
        body: {
          cook_name: name.trim(),
          cook_email: email.trim(),
          cook_phone: phone.trim(),
          event_type: "cook_signup",
          booking_details: {
            cuisines: cuisines.join(", "),
            areas: areas.join(", "),
            experience,
          },
        },
      });
    } catch (e) {
      console.log("Notification skipped:", e);
    }

    setSubmitting(false);
    setDone(true);
  };

  // Done screen
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#FAF9F6" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-8" />
        <div className="w-full max-w-sm rounded-2xl p-6 text-center bg-white border border-gray-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(134,163,131,0.15)" }}>
            <Check className="w-8 h-8" style={{ color: "#86A383" }} />
          </div>
          <h2 className="font-display italic text-xl mb-3" style={{ color: "#2C3B3A" }}>Application received!</h2>
          <p className="font-body text-sm mb-2" style={{ color: "#666" }}>
            We'll review your profile and be in touch within 48 hours.
          </p>
          <p className="font-body text-xs" style={{ color: "#999" }}>
            In the meantime, make sure your Emirates ID and health card are ready to upload once approved.
          </p>
        </div>
      </div>
    );
  }

  // OTP screen
  if (otpScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#FAF9F6" }}>
        <img src={cooqLogo} alt="Cooq" className="h-8 mb-6" />
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="w-8 h-1 rounded-full mx-auto mb-1" style={{ backgroundColor: "#86A383" }} />
            <span className="font-body" style={{ fontSize: "10px", color: "#86A383" }}>1 · Your details</span>
          </div>
          <div className="text-center">
            <div className="w-8 h-1 rounded-full bg-gray-200 mx-auto mb-1" />
            <span className="font-body" style={{ fontSize: "10px", color: "#999" }}>2 · Your profile</span>
          </div>
        </div>
        <div className="w-full max-w-sm rounded-2xl p-6 bg-white border border-gray-100">
          <button onClick={() => setOtpScreen(false)} className="flex items-center gap-1 font-body text-xs mb-4" style={{ color: "#86A383" }}>
            <ArrowLeft className="w-4 h-4" /> Change email
          </button>
          <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#2C3B3A" }}>Check your email</h1>
          <p className="font-body text-xs text-center mb-6" style={{ color: "#999" }}>
            We sent a sign-in link to <span style={{ color: "#86A383" }}>{email}</span>. Click the link or enter the code below.
          </p>

          <OtpInput value={code} onChange={setCode} onComplete={handleVerify} error={!!otpError} />

          {otpError && <p className="font-body text-sm text-red-500 text-center mt-3">{otpError}</p>}
          {verifying && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#86A383" }} />
            </div>
          )}

          <button
            onClick={() => handleVerify(code)} disabled={verifying || code.length < 6}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 disabled:opacity-50"
            style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}
          >
            {verifying ? "Verifying..." : "Verify"}
          </button>

          <button onClick={handleResend} className="font-body text-xs mt-4 block mx-auto hover:underline" style={{ color: "#999" }}>
            Didn't get it? Resend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-8" style={{ backgroundColor: "#FAF9F6" }}>
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-6" />

      {/* Progress */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <div className={`w-8 h-1 rounded-full mx-auto mb-1`} style={{ backgroundColor: step >= 1 ? "#86A383" : "#e5e5e5" }} />
          <span className="font-body" style={{ fontSize: "10px", color: step >= 1 ? "#86A383" : "#999" }}>1 · Your details</span>
        </div>
        <div className="text-center">
          <div className={`w-8 h-1 rounded-full mx-auto mb-1`} style={{ backgroundColor: step >= 2 ? "#86A383" : "#e5e5e5" }} />
          <span className="font-body" style={{ fontSize: "10px", color: step >= 2 ? "#86A383" : "#999" }}>2 · Your profile</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {step === 1 && (
          <div className="rounded-2xl p-6 bg-white border border-gray-100">
            <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#2C3B3A" }}>
              Apply to cook with Cooq
            </h1>
            <p className="font-body text-xs text-center mb-6" style={{ color: "#999" }}>
              Takes 2 minutes. We'll send you a sign-in link by email.
            </p>

            {errors.general && (
              <p className="font-body text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4">{errors.general}</p>
            )}

            <div className="space-y-3">
              <div>
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }} />
                {errors.name && <p className="font-body text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }} />
                {errors.email && <p className="font-body text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl px-3 py-3 shrink-0 font-body text-sm border border-gray-200 bg-white" style={{ color: "#2C3B3A" }}>
                    <span>🇦🇪</span><span>+971</span>
                  </div>
                  <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }} />
                </div>
                {errors.phone && <p className="font-body text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="accent-[#86A383] mt-1"
                  />
                  <span className="font-body text-xs" style={{ color: "#666" }}>
                    I agree to Cooq's{" "}
                    <a href="/cook-agreement" target="_blank" className="underline" style={{ color: "#86A383" }}>cook terms</a>
                  </span>
                </label>
                {errors.agreed && <p className="font-body text-xs text-red-500 mt-1">{errors.agreed}</p>}
              </div>
            </div>

            <button
              onClick={handleSendCode} disabled={loading}
              className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send my code →
            </button>

            <p className="font-body text-xs text-center mt-4" style={{ color: "#999" }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/cook/login")} className="underline" style={{ color: "#86A383" }}>Sign in</button>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl p-6 bg-white border border-gray-100">
            <h1 className="font-display italic text-xl text-center mb-1" style={{ color: "#2C3B3A" }}>
              Complete Your Profile
            </h1>
            <p className="font-body text-xs text-center mb-6" style={{ color: "#999" }}>
              Tell us about yourself so families can find you
            </p>

            {/* Photo upload — optional */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-24 h-24 rounded-full overflow-hidden cursor-pointer relative"
                style={photoPreview ? {} : { border: "2px dashed rgba(134,163,131,0.4)" }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                    <Camera className="w-6 h-6" style={{ color: "#86A383" }} />
                  </div>
                )}
              </div>
              <span className="font-body mt-2" style={{ fontSize: "11px", color: "#999" }}>Add a profile photo (optional — you can add it later)</span>
            </div>

            <div className="space-y-4">
              {/* Bio */}
              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Short bio * ({bio.length}/200)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} placeholder="Tell families a little about yourself and your cooking style." rows={3} className={inputCls} style={{ resize: "none", color: "#2C3B3A" }} />
              </div>

              {/* Cuisines */}
              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "#666" }}>Cuisines you cook *</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((c) => {
                    const selected = cuisines.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggleChip(c, cuisines, setCuisines)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: selected ? "rgba(134,163,131,0.15)" : "rgba(0,0,0,0.03)", border: `1px solid ${selected ? "#86A383" : "rgba(0,0,0,0.1)"}`, color: selected ? "#86A383" : "rgba(45,49,46,0.6)" }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Areas */}
              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "#666" }}>Areas you serve *</label>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((a) => {
                    const selected = areas.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleChip(a, areas, setAreas)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: selected ? "rgba(134,163,131,0.15)" : "rgba(0,0,0,0.03)", border: `1px solid ${selected ? "#86A383" : "rgba(0,0,0,0.1)"}`, color: selected ? "#86A383" : "rgba(45,49,46,0.6)" }}>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience dropdown */}
              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Years of experience *</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }}>
                  <option value="">Select</option>
                  {experienceOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Days available */}
              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "#666" }}>Days available</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((d) => {
                    const selected = days.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleChip(d, days, setDays)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 14px", backgroundColor: selected ? "rgba(134,163,131,0.15)" : "rgba(0,0,0,0.03)", border: `1px solid ${selected ? "#86A383" : "rgba(0,0,0,0.1)"}`, color: selected ? "#86A383" : "rgba(45,49,46,0.6)" }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={handleSubmitProfile} disabled={submitting} className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit for Review
            </button>
          </div>
        )}
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "#999" }}>
        Need help?{" "}
        <a href="mailto:cooqdubai@gmail.com" className="underline">cooqdubai@gmail.com</a>
      </p>
    </div>
  );
};

export default CookSignup;
