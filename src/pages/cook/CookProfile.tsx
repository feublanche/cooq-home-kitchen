import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Loader2, LogOut } from "lucide-react";

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican",
  "American", "Italian", "Keto/Healthy", "Vegan", "Other",
];

const CookProfilePage = () => {
  const { cook, setCook } = useCook();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(cook?.bio || "");
  const [cuisines, setCuisines] = useState<string[]>(cook?.cuisine || []);
  const [experience, setExperience] = useState(String(cook?.years_experience || ""));
  const [photoUrl, setPhotoUrl] = useState(cook?.photo_url || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const isNeedsReview = cook?.status === "needs_review";

  useEffect(() => {
    if (cook) {
      setBio(cook.bio || "");
      setCuisines(cook.cuisine || []);
      setExperience(String(cook.years_experience || ""));
      setPhotoUrl(cook.photo_url || "");
    }
  }, [cook]);

  const inputCls = "w-full py-3 px-4 rounded-xl font-body text-sm border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-[#86A383]";

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { toast({ title: "Only JPG, PNG or WebP allowed", variant: "destructive" }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Image must be under 10MB", variant: "destructive" }); return; }
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!cook) return;
    setSaving(true);

    let newPhotoUrl = cook.photo_url;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${cook.user_id}/profile.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("cook-photos").upload(path, photoFile, { upsert: true });
      if (uploadErr) { toast({ title: "Photo upload failed", variant: "destructive" }); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("cook-photos").getPublicUrl(path);
      newPhotoUrl = urlData.publicUrl;
    }

    const updatePayload: any = {
      bio: bio.trim() || null,
      cuisine: cuisines,
      years_experience: parseInt(experience) || 0,
      photo_url: newPhotoUrl,
    };

    // If cook is approved or needs_review, reset to pending on save so operator re-reviews
    if (isNeedsReview || cook.status === "approved" || cook.status === "active") {
      updatePayload.status = "pending";
      updatePayload.operator_notes = null;
    }

    const { error } = await supabase
      .from("cooks")
      .update(updatePayload)
      .eq("id", cook.id);

    if (error) {
      toast({ title: "Save failed: " + error.message, variant: "destructive" });
    } else {
      const statusChanged = isNeedsReview || cook.status === "approved" || cook.status === "active";
      const updatedCook = {
        ...cook,
        bio: bio.trim() || null,
        cuisine: cuisines,
        years_experience: parseInt(experience) || 0,
        photo_url: newPhotoUrl,
        ...(statusChanged ? { status: "pending", operator_notes: null } : {}),
      };
      setCook(updatedCook);
      toast({ title: "Profile updated ✓" });

      // Notify operator if profile was updated and status reset
      if (statusChanged) {
        try {
          await supabase.functions.invoke("notify-operator", {
            body: {
              event_type: "profile_updated",
              details: { cook_name: cook.name },
            },
          });
        } catch {}
      }
    }
    setSaving(false);
  };

  const initials = cook?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/cook/dashboard")}>
            <ArrowLeft className="w-5 h-5" style={{ color: "#2C3B3A" }} />
          </button>
          <h1 className="font-display" style={{ fontSize: "20px", color: "#2C3B3A" }}>My Profile</h1>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate("/cook/login", { replace: true }); }}
          className="flex items-center gap-1 font-body text-xs"
          style={{ color: "#999" }}
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      {/* Needs review banner */}
      {isNeedsReview && (
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="font-body text-sm" style={{ color: "#D97706" }}>
            ⚠️ Please update your profile based on feedback: {cook?.operator_notes || "See dashboard for details."}
          </p>
          <p className="font-body text-xs mt-1" style={{ color: "#92400E" }}>
            Saving will resubmit your profile for review.
          </p>
        </div>
      )}

      {/* Info banner for approved cooks */}
      {(cook?.status === "approved" || cook?.status === "active") && (
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.2)" }}>
          <p className="font-body text-xs" style={{ color: "#86A383" }}>
            ℹ️ Saving changes will resubmit your profile for review. Your listing stays live until the review is complete.
          </p>
        </div>
      )}

      {/* Photo */}
      <div className="flex justify-center mb-6">
        <div
          className="w-24 h-24 rounded-full overflow-hidden cursor-pointer relative"
          style={photoUrl ? {} : { border: "2px dashed rgba(134,163,131,0.4)" }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)} />
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <span className="font-display text-2xl" style={{ color: "#86A383" }}>{initials}</span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#B87355" }}>
            <Camera className="w-3.5 h-3.5" style={{ color: "#FAF9F6" }} />
          </div>
        </div>
      </div>

      <p className="font-body text-center mb-6 font-semibold" style={{ fontSize: "16px", color: "#2C3B3A" }}>{cook?.name}</p>

      {/* Status badge */}
      <div className="flex justify-center mb-6">
        <span className="font-body rounded-full px-3 py-1" style={{
          fontSize: "11px",
          backgroundColor: cook?.status === "approved" || cook?.status === "active" ? "rgba(134,163,131,0.1)" : "rgba(181,126,93,0.1)",
          color: cook?.status === "approved" || cook?.status === "active" ? "#86A383" : "#B57E5D",
        }}>
          {cook?.status === "approved" || cook?.status === "active" ? "Live on Cooq ✓" : `Status: ${cook?.status || "pending"}`}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Bio ({bio.length}/200)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} placeholder="Tell us about your cooking style and specialities" rows={3} className={inputCls} style={{ resize: "none", color: "#2C3B3A" }} />
        </div>

        <div>
          <label className="font-body text-xs block mb-2" style={{ color: "#666" }}>Cuisines</label>
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

        <div>
          <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Years of experience</label>
          <input type="number" min="0" max="50" value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-body font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {isNeedsReview ? "Save & Resubmit for Review" : (cook?.status === "approved" || cook?.status === "active") ? "Save & Resubmit for Review" : "Save Changes"}
      </button>
    </div>
  );
};

export default CookProfilePage;
