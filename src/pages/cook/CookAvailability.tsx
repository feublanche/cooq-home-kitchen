import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'];

type DayState = { on: boolean; slots: string[] };

const CookAvailability = () => {
  const { cook } = useCook();
  const [avail, setAvail] = useState<Record<number, DayState>>({
    0: { on: false, slots: [] }, 1: { on: false, slots: [] }, 2: { on: false, slots: [] },
    3: { on: false, slots: [] }, 4: { on: false, slots: [] }, 5: { on: false, slots: [] }, 6: { on: false, slots: [] },
  });
  const [saving, setSaving] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockedList, setBlockedList] = useState<string[]>([]);

  useEffect(() => {
    if (!cook) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("cook_availability")
          .select("*")
          .eq("cook_id", cook.id);
        if (data) {
          const loaded: Record<number, DayState> = { ...avail };
          data.forEach((row: any) => {
            loaded[row.day_of_week] = { on: row.available ?? false, slots: row.time_slots || [] };
          });
          setAvail(loaded);
        }
      } catch { /* table may not exist yet */ }

      // Load blocked dates
      try {
        const { data: blocked } = await supabase
          .from("cook_blocked_dates" as any)
          .select("blocked_date")
          .eq("cook_id", cook.id);
        if (blocked) {
          setBlockedList((blocked as any[]).map((r: any) => r.blocked_date));
        }
      } catch { /* table may not exist yet */ }
    };
    load();
  }, [cook]);

  const save = async (dayIndex: number, updated: DayState) => {
    if (!cook) return;
    setSaving(true);
    try {
      await supabase.from("cook_availability").upsert(
        {
          cook_id: cook.id,
          day_of_week: dayIndex,
          available: updated.on,
          time_slots: updated.slots,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cook_id,day_of_week" }
      );
      toast({ title: "Saved ✓" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleDay = (i: number) => {
    const updated = { ...avail[i], on: !avail[i].on };
    setAvail((prev) => ({ ...prev, [i]: updated }));
    save(i, updated);
  };

  const toggleSlot = (i: number, slot: string, checked: boolean) => {
    const slots = checked
      ? [...avail[i].slots, slot]
      : avail[i].slots.filter((s) => s !== slot);
    const updated = { ...avail[i], slots };
    setAvail((prev) => ({ ...prev, [i]: updated }));
    save(i, updated);
  };

  const handleBlockDate = async () => {
    if (!cook || !blockDate) return;
    if (blockedList.includes(blockDate)) {
      toast({ title: "Date already blocked", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("cook_blocked_dates" as any).insert({
        cook_id: cook.id,
        blocked_date: blockDate,
      } as any);
      if (error) throw error;
      setBlockedList(prev => [...prev, blockDate]);
      setBlockDate('');
      toast({ title: "Date blocked ✓" });
    } catch (e: any) {
      toast({ title: "Failed to block date", description: e?.message, variant: "destructive" });
    }
  };

  const handleUnblockDate = async (d: string) => {
    if (!cook) return;
    try {
      await supabase.from("cook_blocked_dates" as any).delete().eq("cook_id", cook.id).eq("blocked_date", d);
      setBlockedList(prev => prev.filter(x => x !== d));
      toast({ title: "Date unblocked ✓" });
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6" style={{ backgroundColor: "#2D312E" }}>
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-5 h-5" style={{ color: "#86A383" }} />
        <h1 className="font-display" style={{ fontSize: "22px", color: "#F9F7F2" }}>
          My Schedule
        </h1>
      </div>
      <p className="font-body mb-6" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
        Set your weekly availability
      </p>

      {/* Day toggles */}
      <div className="flex flex-wrap gap-2 mt-6">
        {DAY_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`px-4 py-2 rounded-full text-sm font-body transition-colors ${
              avail[i].on ? "bg-[#86A383] text-white" : "text-[rgba(249,247,242,0.4)]"
            }`}
            style={!avail[i].on ? { backgroundColor: "rgba(249,247,242,0.06)" } : undefined}
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
            {TIME_SLOTS.map((slot) => (
              <label key={slot} className="flex items-center gap-2 mb-2 font-body text-sm cursor-pointer" style={{ color: "rgba(249,247,242,0.7)" }}>
                <input type="checkbox" checked={avail[i].slots.includes(slot)} onChange={(e) => toggleSlot(i, slot, e.target.checked)} className="accent-[#86A383]" />
                {slot}
              </label>
            ))}
          </div>
        ) : null
      )}

      {/* Block specific dates */}
      <p className="font-body text-[13px] font-semibold mt-6" style={{ color: "#F9F7F2" }}>Block specific dates</p>
      <p className="font-body text-xs mb-3" style={{ color: "#86A383" }}>Mark dates you're unavailable</p>

      <div className="flex items-center">
        <input
          type="date"
          value={blockDate}
          onChange={(e) => setBlockDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="bg-[rgba(249,247,242,0.06)] text-[#F9F7F2] rounded-xl px-3 py-2 text-sm border border-[rgba(134,163,131,0.3)] mr-2"
        />
        <button
          onClick={handleBlockDate}
          disabled={!blockDate}
          className="px-4 py-2 rounded-xl text-sm font-body font-semibold transition-colors disabled:opacity-40"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          Block date
        </button>
      </div>

      {blockedList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {blockedList.map(d => (
            <span key={d} className="bg-[#B57E5D]/20 text-[#d4a882] text-xs px-3 py-1 rounded-full flex items-center gap-1">
              {new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              <button onClick={() => handleUnblockDate(d)} className="ml-1 text-[#d4a882] hover:text-white">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mx-0 mt-6 rounded-xl p-3" style={{ backgroundColor: "rgba(181,126,93,0.1)", border: "1px solid rgba(181,126,93,0.3)" }}>
        <p className="font-body text-xs" style={{ color: "#B57E5D" }}>
          Update your availability at least 48 hours in advance. Customers can only book you on days you've marked as available.
        </p>
      </div>

      <CookBottomNav />
    </div>
  );
};

export default CookAvailability;
