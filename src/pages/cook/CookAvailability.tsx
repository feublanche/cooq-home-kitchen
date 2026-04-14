import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = [
  { key: "morning", label: "Morning (8am–12pm)" },
  { key: "afternoon", label: "Afternoon (12pm–4pm)" },
  { key: "evening", label: "Evening (4pm–8pm)" },
];

type DayState = { on: boolean; slots: string[] };

const defaultDays = (): Record<number, DayState> =>
  Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, { on: false, slots: [] }]));

const CookAvailability = () => {
  const { cook } = useCook();
  const [avail, setAvail] = useState<Record<number, DayState>>(defaultDays());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!cook) return;
    supabase
      .from("cook_availability")
      .select("*")
      .eq("cook_id", cook.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loaded = defaultDays();
          data.forEach((row: any) => {
            loaded[row.day_of_week] = {
              on: row.available !== false,
              slots: (row.time_slots || []) as string[],
            };
          });
          setAvail(loaded);
        }
        setLoaded(true);
      });
  }, [cook]);

  const handleSave = async () => {
    if (!cook) return;
    setSaving(true);
    try {
      const rows = Object.entries(avail).map(([day, state]) => ({
        cook_id: cook.id,
        day_of_week: Number(day),
        available: state.on,
        time_slots: state.slots,
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        await supabase.from("cook_availability").upsert(row, { onConflict: "cook_id,day_of_week" });
      }
      toast.success("Availability saved ✓");
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const toggleDay = (i: number) => {
    setAvail((prev) => ({
      ...prev,
      [i]: { ...prev[i], on: !prev[i].on, slots: !prev[i].on ? prev[i].slots : [] },
    }));
  };

  const toggleSlot = (i: number, slot: string) => {
    setAvail((prev) => {
      const current = prev[i].slots;
      const slots = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
      return { ...prev, [i]: { ...prev[i], slots } };
    });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
        <div className="w-8 h-8 border-2 border-[#86A383] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-6" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-5 h-5" style={{ color: "#86A383" }} />
        <h1 className="font-display text-xl" style={{ color: "#2C3B3A" }}>My Schedule</h1>
      </div>
      <p className="font-body text-xs mb-6" style={{ color: "rgba(44,59,58,0.5)" }}>
        Set your weekly availability
      </p>

      {/* Day toggles */}
      <div className="flex flex-wrap gap-2">
        {DAY_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`px-4 py-2 rounded-full text-sm font-body transition-colors ${
              avail[i].on ? "text-white" : ""
            }`}
            style={
              avail[i].on
                ? { backgroundColor: "#86A383" }
                : { backgroundColor: "rgba(44,59,58,0.06)", color: "rgba(44,59,58,0.4)" }
            }
          >
            {name}
          </button>
        ))}
      </div>

      {/* Time slots per active day */}
      {DAY_NAMES.map((name, i) =>
        avail[i].on ? (
          <div key={`slots-${i}`} className="mt-4 px-1">
            <p className="font-body text-xs font-semibold mb-2" style={{ color: "#86A383" }}>{name}</p>
            {SLOTS.map((slot) => (
              <label
                key={slot.key}
                className="flex items-center gap-2 mb-2 font-body text-sm cursor-pointer"
                style={{ color: "rgba(44,59,58,0.7)" }}
              >
                <input
                  type="checkbox"
                  checked={avail[i].slots.includes(slot.key)}
                  onChange={() => toggleSlot(i, slot.key)}
                  className="accent-[#86A383]"
                />
                {slot.label}
              </label>
            ))}
          </div>
        ) : null
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-8 py-3 rounded-xl font-body font-semibold text-base text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: "#B87355" }}
      >
        {saving ? "Saving..." : "Save availability"}
      </button>

      {/* Info box */}
      <div className="mt-6 rounded-xl p-3" style={{ backgroundColor: "rgba(184,115,85,0.08)", border: "1px solid rgba(184,115,85,0.2)" }}>
        <p className="font-body text-xs" style={{ color: "#B87355" }}>
          Update your availability at least 48 hours in advance. Customers can only book you on days you've marked as available.
        </p>
      </div>

      <CookBottomNav />
    </div>
  );
};

export default CookAvailability;
