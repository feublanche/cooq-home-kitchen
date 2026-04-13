import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { Loader2, Camera, Check } from "lucide-react";
import { toast } from "sonner";

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

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

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

  const handleCreateAccount = async () => {
    if (!name.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!phone.trim()) { setError("Phone number is required"); return; }
    if (!agreed) { setError("You must agree to the cook terms"); return; }

    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + "/cook/login" },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Account creation failed. Try again.");
      setLoading(false);
      return;
    }

    // Create initial cook row
    const { error: insertError } = await supabase.from("cooks").insert({
      user_id: data.user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: "applied",
    } as any);

    if (insertError) {
      setError("Account created but profile setup failed: " + insertError.message);
      setLoading(false);
      return;
    }

    setUserId(data.user.id);
    setLoading(false);
    setStep(2);
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
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

    // Upload photo
    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${userId}/profile.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("cook-photos")
      .upload(path, photoFile, { upsert: true });

    if (uploadError) {
      toast.error("Photo upload failed: " + uploadError.message);
      setSubmitting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("cook-photos").getPublicUrl(path);

    // Update cook row
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

    if (updateError) {
      toast.error("Profile update failed: " + updateError.message);
      setSubmitting(false);
      return;
    }

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
          <h2 className="font-display italic text-xl mb-3" style={{ color: "#F9F7F2" }}>
            Profile Submitted!
          </h2>
          <p className="font-body text-sm mb-6" style={{ color: "rgba(249,247,242,0.6)" }}>
            Your profile is under review. We'll WhatsApp you within 48 hours.
          </p>
          <button
            onClick={() => navigate("/cook/login")}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm"
            style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
          >
            Go to Login
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
        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "#86A383" }} />
        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: step >= 2 ? "#86A383" : "rgba(249,247,242,0.15)" }} />
      </div>

      <div className="w-full max-w-sm">
        {step === 1 && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(249,247,242,0.05)" }}>
            <h1 className="font-display italic text-2xl text-center mb-1" style={{ color: "#F9F7F2" }}>
              Apply to Cook
            </h1>
            <p className="font-body text-xs text-center mb-6" style={{ color: "rgba(249,247,242,0.5)" }}>
              Step 1: Create your account
            </p>

            {error && (
              <p className="font-body text-sm text-red-400 bg-red-400/10 rounded-lg p-3 mb-4">{error}</p>
            )}

            <div className="space-y-3">
              <input
                type="text" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)} style={inputStyle}
              />
              <input
                type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle}
              />
              <input
                type="password" placeholder="Password (min 8 characters)" value={password}
                onChange={(e) => setPassword(e.target.value)} style={inputStyle}
              />
              <input
                type="tel" placeholder="Phone (e.g. +971 55 123 4567)" value={phone}
                onChange={(e) => setPhone(e.target.value)} style={inputStyle}
              />

              <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="accent-[#86A383] mt-1"
                />
                <span className="font-body text-xs" style={{ color: "rgba(249,247,242,0.6)" }}>
                  I agree to Cooq's{" "}
                  <a href="/cook-agreement" target="_blank" className="underline" style={{ color: "#86A383" }}>
                    cook terms
                  </a>
                </span>
              </label>
            </div>

            <button
              onClick={handleCreateAccount} disabled={loading}
              className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>

            <p className="font-body text-xs text-center mt-4" style={{ color: "rgba(249,247,242,0.4)" }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/cook/login")} className="underline" style={{ color: "#86A383" }}>
                Sign in
              </button>
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
                style={photoPreview ? {} : {
                  backgroundColor: "rgba(249,247,242,0.06)",
                  border: "2px dashed rgba(134,163,131,0.4)",
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                  className="hidden" onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                />
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Camera className="w-6 h-6" style={{ color: "#86A383" }} />
                    <span className="font-body mt-1" style={{ fontSize: "9px", color: "rgba(249,247,242,0.5)" }}>
                      Add photo *
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Bio */}
              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>
                  Short bio ({bio.length}/200)
                </label>
                <textarea
                  value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell families what makes your cooking special..."
                  rows={3} style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* Cuisines */}
              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "rgba(249,247,242,0.5)" }}>
                  Cuisines you cook *
                </label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((c) => {
                    const selected = cuisines.includes(c);
                    return (
                      <button
                        key={c} type="button"
                        onClick={() => toggleChip(c, cuisines, setCuisines)}
                        className="rounded-full font-body"
                        style={{
                          fontSize: "12px", padding: "6px 12px",
                          backgroundColor: selected ? "rgba(134,163,131,0.2)" : "rgba(249,247,242,0.06)",
                          border: `1px solid ${selected ? "#86A383" : "rgba(134,163,131,0.2)"}`,
                          color: selected ? "#86A383" : "rgba(249,247,242,0.5)",
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Areas */}
              <div>
                <label className="font-body text-xs block mb-2" style={{ color: "rgba(249,247,242,0.5)" }}>
                  Areas you can serve *
                </label>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((a) => {
                    const selected = areas.includes(a);
                    return (
                      <button
                        key={a} type="button"
                        onClick={() => toggleChip(a, areas, setAreas)}
                        className="rounded-full font-body"
                        style={{
                          fontSize: "12px", padding: "6px 12px",
                          backgroundColor: selected ? "rgba(134,163,131,0.2)" : "rgba(249,247,242,0.06)",
                          border: `1px solid ${selected ? "#86A383" : "rgba(134,163,131,0.2)"}`,
                          color: selected ? "#86A383" : "rgba(249,247,242,0.5)",
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>
                  Years of cooking experience
                </label>
                <input
                  type="number" min="0" max="50" value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 5" style={inputStyle}
                />
              </div>
            </div>

            <button
              onClick={handleSubmitProfile} disabled={submitting}
              className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit for Review
            </button>
          </div>
        )}
      </div>

      <p className="font-body text-xs mt-6" style={{ color: "rgba(249,247,242,0.4)" }}>
        Need help?{" "}
        <a href="mailto:hello@cooq.ae" className="underline" style={{ color: "rgba(249,247,242,0.6)" }}>
          hello@cooq.ae
        </a>
      </p>
    </div>
  );
};

export default CookSignup;
