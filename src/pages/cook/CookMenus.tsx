import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Lock, Loader2 } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

interface CookMenu {
  id: string;
  menu_name: string;
  description: string | null;
  meals: string[] | null;
  cuisine: string | null;
  dietary: string[] | null;
  price_aed: number;
  status: string | null;
  rejection_reason: string | null;
  photo_urls: string[] | null;
}

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican",
  "American", "Italian", "Keto/Healthy", "Vegan", "Other",
];

const dietaryOptions = ["Halal", "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Keto"];

const CookMenus = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<CookMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [menuName, setMenuName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [starterName, setStarterName] = useState("");
  const [starterDesc, setStarterDesc] = useState("");
  const [mainName, setMainName] = useState("");
  const [mainDesc, setMainDesc] = useState("");
  const [sideName, setSideName] = useState("");
  const [sideDesc, setSideDesc] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPending = cook?.status === "pending" || cook?.status === "applied";

  const fetchMenus = async () => {
    if (!cook) return;
    const { data } = await supabase
      .from("cook_menus")
      .select("id, menu_name, description, meals, cuisine, dietary, price_aed, status, rejection_reason, photo_urls")
      .eq("cook_id", cook.id)
      .order("created_at", { ascending: false });
    setMenus((data ?? []) as CookMenu[]);
    setLoading(false);
  };

  useEffect(() => { fetchMenus(); }, [cook]);

  const resetForm = () => {
    setMenuName(""); setCuisine(""); setStarterName(""); setStarterDesc("");
    setMainName(""); setMainDesc(""); setSideName(""); setSideDesc("");
    setDietary([]); setPrice(""); setEditId(null);
  };

  const menusForCuisine = (c: string) => menus.filter((m) => m.cuisine === c).length;

  const canAddForCuisine = (c: string) => menusForCuisine(c) < 2;

  const openEdit = (m: CookMenu) => {
    if (m.status !== "rejected" && m.status !== "pending_review") return;
    setEditId(m.id);
    setMenuName(m.menu_name);
    setCuisine(m.cuisine || "");
    // Parse meals: [starterName, starterDesc, mainName, mainDesc, sideName, sideDesc]
    const meals = m.meals || [];
    setStarterName(meals[0] || "");
    setStarterDesc(meals[1] || "");
    setMainName(meals[2] || "");
    setMainDesc(meals[3] || "");
    setSideName(meals[4] || "");
    setSideDesc(meals[5] || "");
    setDietary(m.dietary || []);
    setPrice(String(m.price_aed));
    setShowForm(true);
  };

  const toggleDietary = (val: string) => {
    setDietary(dietary.includes(val) ? dietary.filter((x) => x !== val) : [...dietary, val]);
  };

  const handleSubmit = async () => {
    if (!cook) return;
    if (!menuName.trim() || !cuisine || !starterName.trim() || !mainName.trim() || !sideName.trim() || !price) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!editId && !canAddForCuisine(cuisine)) {
      toast({ title: `You already have 2 ${cuisine} menus. Edit an existing one.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const payload = {
      menu_name: menuName.trim(),
      description: null,
      meals: [starterName.trim(), starterDesc.trim(), mainName.trim(), mainDesc.trim(), sideName.trim(), sideDesc.trim()],
      cuisine,
      dietary,
      price_aed: parseInt(price) || 350,
      status: "pending_review",
    };

    if (editId) {
      const { error } = await supabase.from("cook_menus").update(payload as any).eq("id", editId);
      if (error) toast({ title: "Update failed", variant: "destructive" });
      else toast({ title: "Menu resubmitted for review ✓" });
    } else {
      const { error } = await supabase.from("cook_menus").insert({
        ...payload,
        cook_id: cook.id,
        cook_name: cook.name,
      } as any);
      if (error) toast({ title: "Submit failed: " + error.message, variant: "destructive" });
      else {
        toast({ title: "Menu submitted ✓", description: "We'll review within 24 hours." });
        // Notify operator
        try {
          await supabase.functions.invoke("notify-cook", {
            body: {
              cook_name: cook.name,
              cook_email: cook.email,
              event_type: "menu_submitted",
              booking_details: { menu: menuName.trim(), cuisine },
            },
          });
        } catch (e) { console.log("Notification skipped:", e); }
      }
    }

    resetForm();
    setShowForm(false);
    setSubmitting(false);
    fetchMenus();
  };

  const statusBadge = (s: string | null) => {
    if (s === "approved") return { bg: "rgba(134,163,131,0.15)", text: "#86A383", label: "Live ✓" };
    if (s === "rejected") return { bg: "rgba(239,68,68,0.08)", text: "#ef4444", label: "Not approved" };
    return { bg: "rgba(181,126,93,0.1)", text: "#B57E5D", label: "Awaiting approval" };
  };

  const inputCls = "w-full py-3 px-4 rounded-xl font-body text-sm border border-gray-200 bg-white outline-none focus:ring-1 focus:ring-[#86A383]";

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/cook/dashboard")}>
            <ArrowLeft className="w-5 h-5" style={{ color: "#2C3B3A" }} />
          </button>
          <h1 className="font-display" style={{ fontSize: "20px", color: "#2C3B3A" }}>My Menus</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => { if (isPending) return; resetForm(); setShowForm(true); }}
            disabled={isPending}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 font-body font-semibold disabled:opacity-40"
            style={{ fontSize: "12px", backgroundColor: "#B87355", color: "#FAF9F6" }}
            title={isPending ? "Available once your profile is approved" : ""}
          >
            <Plus className="w-4 h-4" /> Add menu
          </button>
        )}
      </div>

      {isPending && !showForm && (
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(181,126,93,0.08)", border: "1px solid rgba(181,126,93,0.15)" }}>
          <p className="font-body text-xs" style={{ color: "#B57E5D" }}>Menu creation will be available once your profile is approved.</p>
        </div>
      )}

      {!showForm && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl animate-pulse bg-white border border-gray-100" style={{ height: "80px" }} />
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <span style={{ fontSize: "32px" }}>🍽️</span>
              <p className="font-body font-semibold mt-2" style={{ fontSize: "14px", color: "#2C3B3A" }}>No menus yet</p>
              <p className="font-body text-center mt-1" style={{ fontSize: "12px", color: "#999" }}>
                Add your first menu so customers can book you.
              </p>
            </div>
          ) : (
            menus.map((m) => {
              const badge = statusBadge(m.status);
              const isLocked = m.status === "approved";
              const canEdit = m.status === "rejected" || m.status === "pending_review";
              return (
                <div key={m.id} className={`rounded-xl p-4 mb-3 bg-white border border-gray-100 ${canEdit ? "cursor-pointer" : ""}`} onClick={() => canEdit && openEdit(m)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body font-bold" style={{ fontSize: "14px", color: "#2C3B3A" }}>{m.menu_name}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5" style={{ color: "#ccc" }} />}
                      </div>
                      <p className="font-body mt-1" style={{ fontSize: "12px", color: "#86A383" }}>AED {m.price_aed} · {m.cuisine}</p>
                    </div>
                    <span className="font-body rounded-full px-2.5 py-0.5 shrink-0" style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                  </div>
                  {m.meals && m.meals.length >= 6 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-body" style={{ fontSize: "11px", color: "#666" }}><strong>Starter:</strong> {m.meals[0]}</p>
                      <p className="font-body" style={{ fontSize: "11px", color: "#666" }}><strong>Main:</strong> {m.meals[2]}</p>
                      <p className="font-body" style={{ fontSize: "11px", color: "#666" }}><strong>Side:</strong> {m.meals[4]}</p>
                    </div>
                  )}
                  {m.dietary && m.dietary.length > 0 && (
                    <p className="font-body mt-1" style={{ fontSize: "10px", color: "#999" }}>{m.dietary.join(" · ")}</p>
                  )}
                  <p className="font-body mt-2 italic" style={{ fontSize: "10px", color: "#999" }}>
                    Food photos added by Cooq team after your trial.
                  </p>
                  {isLocked && (
                    <p className="font-body mt-1" style={{ fontSize: "10px", color: "#999" }}>
                      Contact cooqdubai@gmail.com to change an approved menu.
                    </p>
                  )}
                  {m.status === "rejected" && (
                    <>
                      {m.rejection_reason && (
                        <p className="font-body italic mt-1 text-red-400" style={{ fontSize: "11px" }}>{m.rejection_reason}</p>
                      )}
                      <p className="font-body mt-1" style={{ fontSize: "10px", color: "#ef4444" }}>
                        Contact cooqdubai@gmail.com
                      </p>
                    </>
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
          <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder='Menu name (e.g. "Lebanese Family Feast")' className={inputCls} style={{ color: "#2C3B3A" }} />

          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Cuisine *</label>
            <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={inputCls} style={{ color: "#2C3B3A" }}>
              <option value="">Select cuisine</option>
              {cuisineOptions.map((c) => (
                <option key={c} value={c} disabled={!editId && !canAddForCuisine(c)}>
                  {c}{!editId && menusForCuisine(c) >= 2 ? " (2/2)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 space-y-3">
            <p className="font-body text-xs font-semibold" style={{ color: "#2C3B3A" }}>Starter</p>
            <input value={starterName} onChange={(e) => setStarterName(e.target.value)} placeholder="Dish name (e.g. Hummus with warm pita)" className={inputCls} style={{ color: "#2C3B3A" }} />
            <input value={starterDesc} onChange={(e) => setStarterDesc(e.target.value)} placeholder="Brief description (optional)" className={inputCls} style={{ color: "#2C3B3A" }} />
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 space-y-3">
            <p className="font-body text-xs font-semibold" style={{ color: "#2C3B3A" }}>Main</p>
            <input value={mainName} onChange={(e) => setMainName(e.target.value)} placeholder="Dish name (e.g. Grilled chicken shawarma)" className={inputCls} style={{ color: "#2C3B3A" }} />
            <input value={mainDesc} onChange={(e) => setMainDesc(e.target.value)} placeholder="Brief description (optional)" className={inputCls} style={{ color: "#2C3B3A" }} />
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 space-y-3">
            <p className="font-body text-xs font-semibold" style={{ color: "#2C3B3A" }}>Side</p>
            <input value={sideName} onChange={(e) => setSideName(e.target.value)} placeholder="Dish name (e.g. Fattoush salad)" className={inputCls} style={{ color: "#2C3B3A" }} />
            <input value={sideDesc} onChange={(e) => setSideDesc(e.target.value)} placeholder="Brief description (optional)" className={inputCls} style={{ color: "#2C3B3A" }} />
          </div>

          <div>
            <label className="font-body text-xs block mb-2" style={{ color: "#666" }}>Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((d) => {
                const selected = dietary.includes(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDietary(d)} className="rounded-full font-body" style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: selected ? "rgba(134,163,131,0.15)" : "rgba(0,0,0,0.03)", border: `1px solid ${selected ? "#86A383" : "rgba(0,0,0,0.1)"}`, color: selected ? "#86A383" : "rgba(45,49,46,0.6)" }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>Price per session (AED) *</label>
            <input type="number" min="100" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="350" className={inputCls} style={{ color: "#2C3B3A" }} />
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => { resetForm(); setShowForm(false); }} className="flex-1 py-3 rounded-xl font-body text-sm border border-gray-200" style={{ color: "#999" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#B87355", color: "#FAF9F6" }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? "Resubmit" : "Submit for Review"}
            </button>
          </div>
        </div>
      )}

      <CookBottomNav />
    </div>
  );
};

export default CookMenus;
