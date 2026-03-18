import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

const schema = z.object({
  menu_name: z.string().min(3, "Min 3 characters").max(60, "Max 60 characters"),
  cuisine: z.string().min(1, "Required"),
  meal1: z.string().min(3, "Min 3 characters"),
  meal2: z.string().min(3, "Min 3 characters"),
  meal3: z.string().min(3, "Min 3 characters"),
  meal4: z.string().min(3, "Min 3 characters"),
  meal5: z.string().min(3, "Min 3 characters"),
  price_aed: z.coerce.number().min(350, "Minimum AED 350"),
  serves: z.coerce.number().min(2, "Min 2").max(6, "Max 6"),
  notes: z.string().max(300).optional(),
});

type FormData = z.infer<typeof schema>;

const cuisineOptions = [
  "Arabic", "Lebanese", "Emirati", "Moroccan", "Indian", "Pakistani",
  "Filipino", "Mediterranean", "Asian Fusion", "Italian", "Other",
];

const dietaryOptions = [
  "Halal", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Pork-Free", "Kid-Friendly",
];

interface CookMenu {
  id: string;
  menu_name: string;
  status: string | null;
  rejection_reason: string | null;
}

const CookMenuSubmit = () => {
  const { cook } = useCook();
  const [menus, setMenus] = useState<CookMenu[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { price_aed: 350, serves: 2 },
  });

  const notesLength = (watch("notes") || "").length;

  const fetchMenus = async () => {
    if (!cook) return;
    const { data } = await supabase
      .from("cook_menus")
      .select("id, menu_name, status, rejection_reason")
      .eq("cook_id", cook.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setMenus((data ?? []) as CookMenu[]);
  };

  useEffect(() => {
    fetchMenus();
  }, [cook]);

  const onSubmit = async (d: FormData) => {
    if (!cook) return;
    setSubmitting(true);
    const { error } = await supabase.from("cook_menus").insert({
      cook_id: cook.id,
      cook_name: cook.name,
      menu_name: d.menu_name,
      cuisine: d.cuisine,
      meals: [d.meal1, d.meal2, d.meal3, d.meal4, d.meal5],
      dietary,
      price_aed: Number(d.price_aed),
      serves: Number(d.serves),
      status: "pending_review",
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Failed. Try again.", variant: "destructive" });
    } else {
      toast({ title: "Menu submitted ✓", description: "We'll review within 24 hours." });
      reset();
      setDietary([]);
      fetchMenus();
    }
  };

  const toggleDietary = (d: string) =>
    setDietary((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const statusBadge = (s: string | null) => {
    if (s === "approved") return { bg: "rgba(134,163,131,0.15)", text: "#86A383", label: "Live ✓" };
    if (s === "rejected") return { bg: "rgba(239,68,68,0.1)", text: "#ef4444", label: "Rejected" };
    return { bg: "rgba(181,126,93,0.15)", text: "#B57E5D", label: "Under Review" };
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
    <div className="min-h-screen pb-24 px-4 pt-6" style={{ backgroundColor: "#2D312E" }}>
      <h1 className="font-display" style={{ fontSize: "22px", color: "#F9F7F2" }}>
        Submit a Menu
      </h1>
      <p className="font-body mb-6" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
        Reviewed within 24 hours
      </p>

      {/* Existing menus */}
      <p
        className="uppercase tracking-wider mb-3"
        style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
      >
        My Menus
      </p>
      {menus.length === 0 ? (
        <p className="font-body italic mb-4" style={{ fontSize: "11px", color: "rgba(249,247,242,0.5)" }}>
          No menus yet. Submit below.
        </p>
      ) : (
        menus.map((m) => {
          const badge = statusBadge(m.status);
          return (
            <div
              key={m.id}
              className="rounded-xl p-3 mb-2"
              style={{ backgroundColor: "rgba(249,247,242,0.05)", border: "1px solid rgba(134,163,131,0.18)" }}
            >
              <div className="flex justify-between items-center">
                <span className="font-body font-bold" style={{ fontSize: "13px", color: "#F9F7F2" }}>
                  {m.menu_name}
                </span>
                <span
                  className="font-body rounded-full px-2 py-0.5"
                  style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
              </div>
              {m.status === "rejected" && m.rejection_reason && (
                <p className="font-body italic mt-1" style={{ fontSize: "11px", color: "rgba(239,68,68,0.7)" }}>
                  {m.rejection_reason}
                </p>
              )}
            </div>
          );
        })
      )}

      <div className="my-4" style={{ borderTop: "1px solid rgba(134,163,131,0.2)" }} />

      <p
        className="uppercase tracking-wider mb-4"
        style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
      >
        Submit New Menu
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Menu name */}
        <div>
          <input {...register("menu_name")} placeholder="e.g. Lebanese Family Week" style={inputStyle} />
          {errors.menu_name && <p className="text-red-400 font-body mt-1" style={{ fontSize: "11px" }}>{errors.menu_name.message}</p>}
        </div>

        {/* Cuisine */}
        <div>
          <select {...register("cuisine")} style={{ ...inputStyle, appearance: "none" }}>
            <option value="">Select cuisine</option>
            {cuisineOptions.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#2D312E" }}>{c}</option>
            ))}
          </select>
          {errors.cuisine && <p className="text-red-400 font-body mt-1" style={{ fontSize: "11px" }}>{errors.cuisine.message}</p>}
        </div>

        {/* Meals */}
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n}>
            <label className="font-body mb-1 block" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
              Meal {n}
            </label>
            <input
              {...register(`meal${n}` as keyof FormData)}
              placeholder="e.g. Chicken Shawarma with garlic sauce"
              style={inputStyle}
            />
            {errors[`meal${n}` as keyof typeof errors] && (
              <p className="text-red-400 font-body mt-1" style={{ fontSize: "11px" }}>
                {(errors[`meal${n}` as keyof typeof errors] as any)?.message}
              </p>
            )}
          </div>
        ))}

        {/* Dietary */}
        <div>
          <label className="font-body mb-2 block" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Dietary options
          </label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((d) => {
              const selected = dietary.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDietary(d)}
                  className="rounded-full cursor-pointer font-body"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    backgroundColor: selected ? "rgba(134,163,131,0.2)" : "rgba(249,247,242,0.06)",
                    border: `1px solid ${selected ? "#86A383" : "rgba(134,163,131,0.2)"}`,
                    color: selected ? "#86A383" : "rgba(249,247,242,0.5)",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="font-body mb-1 block" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Price AED
          </label>
          <input {...register("price_aed")} type="number" style={inputStyle} />
          <p style={{ fontSize: "10px", color: "rgba(249,247,242,0.4)" }} className="font-body mt-1">
            Minimum AED 350
          </p>
          {errors.price_aed && <p className="text-red-400 font-body mt-1" style={{ fontSize: "11px" }}>{errors.price_aed.message}</p>}
        </div>

        {/* Serves */}
        <div>
          <label className="font-body mb-1 block" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Serves
          </label>
          <input {...register("serves")} type="number" style={inputStyle} />
          <p style={{ fontSize: "10px", color: "rgba(249,247,242,0.4)" }} className="font-body mt-1">
            How many people?
          </p>
          {errors.serves && <p className="text-red-400 font-body mt-1" style={{ fontSize: "11px" }}>{errors.serves.message}</p>}
        </div>

        {/* Notes */}
        <div className="relative">
          <label className="font-body mb-1 block" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Notes (optional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            maxLength={300}
            placeholder="Seasonal ingredients, equipment needed, anything we should know"
            style={{ ...inputStyle, resize: "none" }}
          />
          <span
            className="absolute bottom-3 right-3 font-body"
            style={{ fontSize: "10px", color: "rgba(249,247,242,0.3)" }}
          >
            {notesLength}/300
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-4 mt-6 font-body font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ fontSize: "14px", backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>
      </form>

      <CookBottomNav />
    </div>
  );
};

export default CookMenuSubmit;
