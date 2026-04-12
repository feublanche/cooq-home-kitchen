import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Lock, Loader2, Camera, X } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

interface CookMenu {
  id: string;
  menu_name: string;
  description: string | null;
  meals: string[] | null;
  cuisine: string | null;
  price_aed: number;
  status: string | null;
  rejection_reason: string | null;
  photo_urls: string[] | null;
}

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Italian", "Asian Fusion", "Moroccan", "Other",
];

const CookMenus = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<CookMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [menuName, setMenuName] = useState("");
  const [description, setDescription] = useState("");
  const [starter, setStarter] = useState("");
  const [main, setMain] = useState("");
  const [side, setSide] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const fetchMenus = async () => {
    if (!cook) return;
    const { data } = await supabase
      .from("cook_menus")
      .select("id, menu_name, description, meals, cuisine, price_aed, status, rejection_reason, photo_urls")
      .eq("cook_id", cook.id)
      .order("created_at", { ascending: false });
    setMenus((data ?? []) as CookMenu[]);
    setLoading(false);
  };

  useEffect(() => { fetchMenus(); }, [cook]);

  const resetForm = () => {
    setMenuName(""); setDescription(""); setStarter(""); setMain(""); setSide("");
    setCuisine(""); setPrice(""); setPhotos([]); setPhotoPreviews([]); setEditId(null);
  };

  const openEdit = (m: CookMenu) => {
    if (m.status === "approved") return;
    setEditId(m.id);
    setMenuName(m.menu_name);
    setDescription(m.description || "");
    setStarter(m.meals?.[0] || "");
    setMain(m.meals?.[1] || "");
    setSide(m.meals?.[2] || "");
    setCuisine(m.cuisine || "");
    setPrice(String(m.price_aed));
    setPhotoPreviews(m.photo_urls || []);
    setShowForm(true);
  };

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = [...photos];
    const newPreviews = [...photoPreviews];
    for (let i = 0; i < files.length && newPhotos.length < 3; i++) {
      const f = files[i];
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) continue;
      if (f.size > 10 * 1024 * 1024) continue;
      newPhotos.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!cook) return;
    if (!menuName.trim() || !starter.trim() || !main.trim() || !side.trim() || !cuisine || !price) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Upload new photos
    const uploadedUrls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${cook.user_id}/menus/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("cook-photos").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("cook-photos").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
    }

    // Keep existing URLs that weren't from new files
    const existingUrls = photoPreviews.filter((p) => p.startsWith("http") && !p.startsWith("blob:"));
    const allUrls = [...existingUrls, ...uploadedUrls].slice(0, 3);

    const payload = {
      menu_name: menuName.trim(),
      description: description.trim() || null,
      meals: [starter.trim(), main.trim(), side.trim()],
      cuisine,
      price_aed: parseInt(price) || 350,
      photo_urls: allUrls,
      status: "pending_review",
    };

    if (editId) {
      const { error } = await supabase.from("cook_menus").update(payload as any).eq("id", editId);
      if (error) toast({ title: "Update failed", variant: "destructive" });
      else toast({ title: "Menu updated ✓" });
    } else {
      const { error } = await supabase.from("cook_menus").insert({
        ...payload,
        cook_id: cook.id,
        cook_name: cook.name,
      } as any);
      if (error) toast({ title: "Submit failed: " + error.message, variant: "destructive" });
      else toast({ title: "Menu submitted ✓", description: "We'll review within 24 hours." });
    }

    resetForm();
    setShowForm(false);
    setSubmitting(false);
    fetchMenus();
  };

  const statusBadge = (s: string | null) => {
    if (s === "approved") return { bg: "rgba(134,163,131,0.15)", text: "#86A383", label: "Live ✓" };
    if (s === "rejected") return { bg: "rgba(239,68,68,0.1)", text: "#ef4444", label: "Not approved" };
    return { bg: "rgba(181,126,93,0.15)", text: "#B57E5D", label: "Awaiting approval" };
  };

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

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ backgroundColor: "#2D312E" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" style={{ color: "#F9F7F2" }} />
          </button>
          <h1 className="font-display" style={{ fontSize: "20px", color: "#F9F7F2" }}>My Menus</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-body font-semibold"
            style={{ fontSize: "12px", backgroundColor: "#B57E5D", color: "#F9F7F2" }}
          >
            <Plus className="w-4 h-4" /> Add menu
          </button>
        )}
      </div>

      {!showForm && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ backgroundColor: "rgba(249,247,242,0.05)", height: "80px" }} />
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <p className="font-body" style={{ fontSize: "13px", color: "rgba(249,247,242,0.5)" }}>
                No menus yet. Tap "Add menu" to get started.
              </p>
            </div>
          ) : (
            menus.map((m) => {
              const badge = statusBadge(m.status);
              const isApproved = m.status === "approved";
              return (
                <div
                  key={m.id}
                  className="rounded-xl p-4 mb-3 cursor-pointer"
                  style={{ backgroundColor: "rgba(249,247,242,0.05)", border: "1px solid rgba(134,163,131,0.18)" }}
                  onClick={() => openEdit(m)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body font-bold" style={{ fontSize: "14px", color: "#F9F7F2" }}>
                          {m.menu_name}
                        </span>
                        {isApproved && <Lock className="w-3.5 h-3.5" style={{ color: "rgba(249,247,242,0.3)" }} />}
                      </div>
                      {m.description && (
                        <p className="font-body mt-1" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
                          {m.description}
                        </p>
                      )}
                      <p className="font-body mt-1" style={{ fontSize: "12px", color: "#86A383" }}>
                        AED {m.price_aed} · {m.cuisine}
                      </p>
                    </div>
                    <span className="font-body rounded-full px-2.5 py-0.5 shrink-0" style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  </div>
                  {m.meals && m.meals.length > 0 && (
                    <p className="font-body italic mt-2" style={{ fontSize: "11px", color: "rgba(249,247,242,0.4)" }}>
                      {m.meals.join(" · ")}
                    </p>
                  )}
                  {isApproved && (
                    <p className="font-body mt-2" style={{ fontSize: "10px", color: "rgba(249,247,242,0.3)" }}>
                      Contact support to change an approved menu
                    </p>
                  )}
                  {m.status === "rejected" && m.rejection_reason && (
                    <p className="font-body italic mt-2" style={{ fontSize: "11px", color: "rgba(239,68,68,0.7)" }}>
                      {m.rejection_reason}
                    </p>
                  )}
                  {m.photo_urls && m.photo_urls.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {m.photo_urls.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-4">
          <input value={menuName} onChange={(e) => setMenuName(e.target.value)}
            placeholder='e.g. "Lebanese Family Feast"' style={inputStyle} />

          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>
              Description ({description.length}/300)
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="A hearty home-cooked spread perfect for families..."
              rows={2} style={{ ...inputStyle, resize: "none" }} />
          </div>

          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}
            style={{ ...inputStyle, appearance: "none" }}>
            <option value="" style={{ backgroundColor: "#2D312E" }}>Select cuisine</option>
            {cuisineOptions.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#2D312E" }}>{c}</option>
            ))}
          </select>

          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Starter</label>
            <input value={starter} onChange={(e) => setStarter(e.target.value)}
              placeholder="e.g. Hummus with warm pita" style={inputStyle} />
          </div>
          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Main</label>
            <input value={main} onChange={(e) => setMain(e.target.value)}
              placeholder="e.g. Grilled chicken shawarma platter" style={inputStyle} />
          </div>
          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Side</label>
            <input value={side} onChange={(e) => setSide(e.target.value)}
              placeholder="e.g. Fattoush salad with pomegranate" style={inputStyle} />
          </div>

          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "rgba(249,247,242,0.5)" }}>Price per session (AED)</label>
            <input type="number" min="100" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="350" style={inputStyle} />
          </div>

          <div>
            <label className="font-body text-xs block mb-2" style={{ color: "rgba(249,247,242,0.5)" }}>
              Food photos (up to 3)
            </label>
            <div className="flex gap-2">
              {photoPreviews.map((p, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 rounded-full p-0.5" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <X className="w-3 h-3" style={{ color: "#F9F7F2" }} />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 3 && (
                <div
                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer"
                  style={{ backgroundColor: "rgba(249,247,242,0.04)", border: "2px dashed rgba(134,163,131,0.3)" }}
                  onClick={() => photoRef.current?.click()}
                >
                  <Camera className="w-5 h-5" style={{ color: "#86A383" }} />
                  <span className="font-body" style={{ fontSize: "9px", color: "rgba(249,247,242,0.4)" }}>Add</span>
                </div>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
              className="hidden" onChange={(e) => handlePhotoAdd(e.target.files)} />
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => { resetForm(); setShowForm(false); }}
              className="flex-1 py-3 rounded-xl font-body text-sm"
              style={{ border: "1px solid rgba(134,163,131,0.3)", color: "rgba(249,247,242,0.5)" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? "Update" : "Submit for Review"}
            </button>
          </div>
        </div>
      )}

      <CookBottomNav />
    </div>
  );
};

export default CookMenus;
