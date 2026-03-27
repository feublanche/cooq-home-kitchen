import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import type { User } from "@supabase/supabase-js";
import { Lock } from "lucide-react";

/* ─── CONSTANTS ─── */
const WIZARD_STEPS = ["Tier", "Frequency", "Dates", "Details", "Confirm"];

const PRICES: Record<string, Record<string, number>> = {
  "one-time": { duo: 350, family: 420, large: 550 },
  "first-cook": { duo: 299, family: 420, large: 550 },
  weekly: { duo: 1190, family: 1430, large: 1870 },
  twice: { duo: 2380, family: 2860, large: 3740 },
  three: { duo: 3570, family: 4280, large: 5610 },
};

const SESSIONS: Record<string, number> = {
  "one-time": 1, "first-cook": 1, weekly: 4, twice: 8, three: 12,
};

const SAVINGS: Record<string, Record<string, number>> = {
  weekly: { duo: 210, family: 250, large: 330 },
  twice: { duo: 420, family: 500, large: 660 },
  three: { duo: 630, family: 760, large: 990 },
};

const TIERS = [
  { key: "duo", label: "Cooq Duo", people: "1–2 people", duration: "~2 hrs", detail: "2 proteins · 2 sides" },
  { key: "family", label: "Cooq Family", people: "3–4 people", duration: "~3 hrs", detail: "2 proteins · 3 sides" },
  { key: "large", label: "Cooq Large", people: "5–6 people", duration: "~4 hrs", detail: "3 proteins · 3 sides" },
] as const;

const FREQUENCIES = [
  { key: "one-time", label: "One-time", sub: "Single session" },
  { key: "weekly", label: "Weekly", sub: "Save 15% · 4 sessions/month" },
  { key: "twice", label: "Twice a week", sub: "Save 15% · 8 sessions/month" },
  { key: "three", label: "3× a week", sub: "Save 15% · 12 sessions/month" },
] as const;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIER_LABELS: Record<string, string> = { duo: "Cooq Duo", family: "Cooq Family", large: "Cooq Large" };
const FREQ_LABELS: Record<string, string> = { "one-time": "One-time", weekly: "Weekly", twice: "Twice a week", three: "3× a week" };
const TIER_PARTY: Record<string, number> = { duo: 2, family: 4, large: 6 };

const getTotal = (tier: string, freq: string, first: boolean): number => {
  const key = first && tier === "duo" && freq === "one-time" ? "first-cook" : freq;
  return PRICES[key]?.[tier] ?? 350;
};

/* ─── COMPONENT ─── */
const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const { booking, updateBooking } = useBooking();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Step 1 — Tier
  const [tier, setTier] = useState("duo");
  const [isFirstSession, setIsFirstSession] = useState(false);

  // Step 2 — Frequency
  const [frequency, setFrequency] = useState("one-time");

  // Step 3 — Dates
  const [primaryDate, setPrimaryDate] = useState("");
  const [secondDay, setSecondDay] = useState("");
  const [thirdDay, setThirdDay] = useState("");
  const [secondSessionDate, setSecondSessionDate] = useState("");
  const [secondSessionMenuId, setSecondSessionMenuId] = useState("");
  const [availableMenus, setAvailableMenus] = useState<Array<{ id: string; menu_name: string }>>([]);

  // Step 5 — Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  const primaryMenuName = routerState.selectedMenuName || booking.menuSelected || "Not selected";
  const secondaryMenuName = availableMenus.find(m => m.id === secondSessionMenuId)?.menu_name || "";
  const primaryWeekday = primaryDate ? DAY_NAMES[(new Date(primaryDate).getDay() + 6) % 7] : "";
  const sessionTotal = getTotal(tier, frequency, isFirstSession);
  const isDiscovery = isFirstSession && tier === "duo";
  const cookInitials = routerState.cookInitials || "TBD";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        if (u.user_metadata?.full_name && !booking.customerName)
          updateBooking({ customerName: u.user_metadata.full_name });
        if (u.email && !booking.email) updateBooking({ email: u.email });
      }
    });
  }, []);

  useEffect(() => {
    const cookId = routerState.cookId || booking.cookId;
    if (!cookId) return;
    let active = true;
    supabase.from("cook_menus").select("id, menu_name").eq("cook_id", cookId).eq("status", "approved")
      .then(({ data }) => { if (active) setAvailableMenus((data || []) as any); });
    return () => { active = false; };
  }, [routerState.cookId, booking.cookId]);

  /* ─── NAVIGATION ─── */
  const canNext = (): boolean => {
    if (step === 0) return true; // tier always has default
    if (step === 1) return true; // frequency always has default
    if (step === 2) {
      if (!primaryDate) return false;
      if (frequency === "twice" && (!secondSessionDate || !secondSessionMenuId)) return false;
      if (frequency === "twice" && secondSessionDate === primaryDate) return false;
      if (frequency === "three" && (!secondDay || !thirdDay)) return false;
      return true;
    }
    if (step === 3) {
      return !!(booking.customerName.trim() && booking.email.trim() && booking.phone.trim());
    }
    return true;
  };

  const next = () => {
    if (step < 4) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  /* ─── SUBMIT ─── */
  const handleSubmit = async () => {
    if (!agreedToTerms) return;
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) {
      toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      sessionStorage.setItem("cooq_last_submit", String(Date.now()));
      const recurringDays = [primaryWeekday, frequency === "twice" && secondSessionDate ? DAY_NAMES[(new Date(secondSessionDate).getDay() + 6) % 7] : secondDay, thirdDay].filter(Boolean);
      const sessionNotes = frequency === "twice"
        ? JSON.stringify({ recurring_days: recurringDays, secondary_session: { date: secondSessionDate, menu_id: secondSessionMenuId || null, menu_name: secondaryMenuName || null } })
        : recurringDays.length > 1 ? JSON.stringify({ recurring_days: recurringDays }) : null;

      const insertData: any = {
        customer_name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        area: booking.location || routerState.cookArea || "",
        address: booking.address,
        cook_id: routerState.cookId || booking.cookId || "unassigned",
        cook_name: routerState.cookInitials || booking.cookName || "To be assigned",
        menu_selected: primaryMenuName,
        booking_date: primaryDate || null,
        frequency,
        party_size: TIER_PARTY[tier] || 2,
        dietary: booking.dietary,
        allergies_notes: booking.allergyNotes?.replace(/<[^>]*>/g, "").trim() || "",
        session_notes: sessionNotes,
        grocery_addon: false,
        grocery_fee: 0,
        tier,
        session_type: isDiscovery ? "discovery" : "standard",
        total_aed: sessionTotal,
        status: "pending",
        customer_user_id: user?.id || null,
        selected_menu_id: routerState.selectedMenuId || null,
      };
      const { data: newBooking, error } = await supabase.from("bookings").insert(insertData).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");
      updateBooking({ totalAed: sessionTotal });
      const recurringDaysArr = [primaryWeekday, frequency === "twice" && secondSessionDate ? DAY_NAMES[(new Date(secondSessionDate).getDay() + 6) % 7] : secondDay, thirdDay].filter(Boolean);
      navigate("/payment", {
        state: {
          bookingId: newBooking.id, totalAed: sessionTotal,
          customerName: newBooking.customer_name, customerEmail: newBooking.email,
          area: booking.location || routerState.cookArea || "",
          bookingDate: primaryDate, menuSelected: primaryMenuName,
          cookName: newBooking.cook_name || null, cookId: routerState.cookId,
          selectedMenuName: primaryMenuName,
          secondaryBookingDate: frequency === "twice" ? secondSessionDate : null,
          secondaryMenuName: frequency === "twice" ? secondaryMenuName : null,
          recurringDays: JSON.stringify(recurringDaysArr), frequency,
        },
      });
    } catch (err) {
      console.error("Booking error:", err);
      toast({ title: "Booking failed", description: "Please try again or contact hello@cooq.ae", variant: "destructive" });
    } finally { setLoading(false); }
  };

  /* ─── PROGRESS BAR ─── */
  const ProgressBar = () => (
    <div className="px-6 mb-6">
      <div className="flex gap-1">
        {WIZARD_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <span key={s} className={`font-body text-[10px] ${i <= step ? "text-primary font-medium" : "text-muted-foreground"}`}>{s}</span>
        ))}
      </div>
    </div>
  );

  /* ─── STEP 1: TIER ─── */
  const StepTier = () => (
    <div className="space-y-4">
      <h2 className="font-display italic text-xl text-foreground">Choose your session size</h2>
      <div className="space-y-3">
        {TIERS.map(t => {
          const selected = tier === t.key;
          return (
            <button key={t.key} type="button" onClick={() => { setTier(t.key); if (t.key !== "duo") setIsFirstSession(false); }}
              className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <p className="font-body text-base font-bold text-foreground">{t.label}</p>
              <p className="font-body text-sm text-muted-foreground mt-1">{t.people} · {t.duration}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{t.detail}</p>
              {selected && <Check className="w-5 h-5 text-primary mt-2" />}
            </button>
          );
        })}
      </div>
      <label className={`flex items-center gap-2.5 mt-2 ${tier !== "duo" ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}>
        <input type="checkbox" checked={isFirstSession} onChange={e => setIsFirstSession(e.target.checked)}
          disabled={tier !== "duo"} className="w-4 h-4 rounded border-border accent-primary" />
        <span className="font-body text-sm text-foreground">This is my first Cooq session</span>
      </label>
      {tier !== "duo" && <p className="font-body text-xs text-muted-foreground italic ml-6">First Cook trial is Duo only</p>}
      {isFirstSession && tier === "duo" && <p className="font-body text-xs text-accent ml-6">AED 299 discovery rate applied</p>}
    </div>
  );

  /* ─── STEP 2: FREQUENCY ─── */
  const StepFrequency = () => (
    <div className="space-y-4">
      <h2 className="font-display italic text-xl text-foreground">How often?</h2>
      <div className="space-y-3">
        {FREQUENCIES.map(f => {
          const selected = frequency === f.key;
          return (
            <button key={f.key} type="button" onClick={() => { setFrequency(f.key); setSecondDay(""); setThirdDay(""); setSecondSessionDate(""); setSecondSessionMenuId(""); }}
              className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <p className="font-body text-base font-bold text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{f.sub}</p>
              {selected && <Check className="w-5 h-5 text-primary mt-2" />}
            </button>
          );
        })}
      </div>
      {/* Dynamic price summary */}
      <div className="bg-card rounded-xl border border-border p-4 mt-2">
        <p className="font-body text-sm text-muted-foreground">{TIER_LABELS[tier]} · {FREQ_LABELS[frequency]}</p>
        <p className="font-display text-xl font-bold text-accent mt-1">
          AED {sessionTotal.toLocaleString()}{frequency !== "one-time" ? " /mo" : ""}
        </p>
        {frequency !== "one-time" && SAVINGS[frequency] && (
          <p className="font-body text-xs text-primary mt-1">
            You save AED {SAVINGS[frequency]?.[tier]} per month vs one-time · {SESSIONS[frequency]} sessions
          </p>
        )}
        {isDiscovery && <p className="font-body text-xs text-accent mt-1">First Cook trial: AED 299</p>}
      </div>
    </div>
  );

  /* ─── STEP 3: DATES ─── */
  const StepDates = () => (
    <div className="space-y-5">
      <h2 className="font-display italic text-xl text-foreground">Choose your session date{frequency !== "one-time" ? "s" : ""}</h2>

      <div>
        <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
          {frequency === "weekly" ? "Session date (recurring weekly on this day)" : "First session date"}
        </label>
        <input type="date" min={minDate} value={primaryDate} onChange={e => setPrimaryDate(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        {primaryDate && frequency === "weekly" && (
          <p className="font-body text-xs text-muted-foreground mt-1">Recurring every {primaryWeekday}</p>
        )}
      </div>

      {/* Twice a week: 2nd date + 2nd menu */}
      {frequency === "twice" && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="font-body text-sm font-semibold text-foreground">Second weekly session</p>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Second date *</label>
            <input type="date" min={minDate} value={secondSessionDate} onChange={e => setSecondSessionDate(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            {secondSessionDate && secondSessionDate === primaryDate && (
              <p className="font-body text-xs text-destructive mt-1">Must be different from first date</p>
            )}
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground mb-1 block">Second menu *</label>
            {availableMenus.length > 0 ? (
              <select value={secondSessionMenuId} onChange={e => setSecondSessionMenuId(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select menu</option>
                {availableMenus.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="Describe your preferred menu" value={secondSessionMenuId}
                onChange={e => setSecondSessionMenuId(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            )}
          </div>
        </div>
      )}

      {/* 3x a week: day-of-week selectors */}
      {frequency === "three" && (
        <div className="space-y-4">
          <div>
            <p className="font-body text-xs text-muted-foreground mb-2">Second day:</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map(day => {
                const disabled = day === primaryWeekday || day === thirdDay;
                const selected = secondDay === day;
                return (
                  <button key={day} type="button" disabled={disabled} onClick={() => setSecondDay(day)}
                    className={`px-4 py-2 rounded-full text-sm transition ${disabled ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground" : selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="font-body text-xs text-muted-foreground mb-2">Third day:</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map(day => {
                const disabled = day === primaryWeekday || day === secondDay;
                const selected = thirdDay === day;
                return (
                  <button key={day} type="button" disabled={disabled} onClick={() => setThirdDay(day)}
                    className={`px-4 py-2 rounded-full text-sm transition ${disabled ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground" : selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ─── STEP 4: DETAILS ─── */
  const StepDetails = () => (
    <div className="space-y-4">
      <h2 className="font-display italic text-xl text-foreground">Your details</h2>

      <FieldInput label="Full name *" value={booking.customerName} readOnly={!!user?.user_metadata?.full_name}
        onChange={v => updateBooking({ customerName: v })} />
      <FieldInput label="Email *" type="email" value={booking.email} readOnly={!!user?.email}
        onChange={v => updateBooking({ email: v })} />
      <FieldInput label="Phone (+971) *" value={booking.phone} onChange={v => updateBooking({ phone: v })} placeholder="+971" />
      <FieldInput label="Dubai area / community" value={booking.location} onChange={v => updateBooking({ location: v })} />
      <FieldInput label="Full address / building name" value={booking.address} onChange={v => updateBooking({ address: v })} />

      <div>
        <label className="font-body text-sm font-medium text-foreground mb-1 block">Allergies or special notes</label>
        <textarea value={booking.allergyNotes} onChange={e => updateBooking({ allergyNotes: e.target.value })}
          className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );

  /* ─── STEP 5: CONFIRM ─── */
  const recurringDays = [primaryWeekday, frequency === "twice" && secondSessionDate ? DAY_NAMES[(new Date(secondSessionDate).getDay() + 6) % 7] : secondDay, thirdDay].filter(Boolean);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";

  const StepConfirm = () => (
    <div className="space-y-5">
      <h2 className="font-display italic text-xl text-foreground">Review your booking</h2>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <SummaryRow label="Cook" value={`${cookInitials}${routerState.cookArea ? " · " + routerState.cookArea : ""}`} />
        <SummaryRow label="Menu" value={primaryMenuName} />
        <SummaryRow label="Tier" value={TIER_LABELS[tier] || tier} />
        <SummaryRow label="Frequency" value={FREQ_LABELS[frequency] || frequency} />
        <SummaryRow label="Date" value={formatDate(primaryDate)} />
        {frequency === "twice" && secondSessionDate && (
          <>
            <SummaryRow label="2nd Date" value={formatDate(secondSessionDate)} />
            <SummaryRow label="2nd Menu" value={secondaryMenuName || "—"} />
          </>
        )}
        {recurringDays.length > 1 && <SummaryRow label="Weekly days" value={recurringDays.join(" + ")} />}
        <SummaryRow label="Address" value={booking.address || booking.location || "—"} />

        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="font-body text-base font-semibold text-foreground">Price</span>
          <span className="font-display text-xl font-bold text-accent">
            AED {sessionTotal.toLocaleString()}{frequency !== "one-time" ? " /mo" : ""}
          </span>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5" />
        <span>
          I agree to Cooq's{" "}
          <a href="/terms" target="_blank" className="text-primary underline">Terms & Conditions</a>{" "}and{" "}
          <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a>
        </span>
      </label>
    </div>
  );

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1.5">
      <span className="font-body text-sm text-muted-foreground">{label}</span>
      <span className="font-body text-sm font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );

  const FieldInput = ({ label, value, onChange, readOnly, type = "text", placeholder }: {
    label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="font-body text-sm font-medium text-foreground mb-1 block">{label}</label>
      <div className="relative">
        <input type={type} value={value} readOnly={readOnly} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10" />
        {readOnly && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
      </div>
    </div>
  );

  /* ─── RENDER ─── */
  const stepContent = [<StepTier key={0} />, <StepFrequency key={1} />, <StepDates key={2} />, <StepDetails key={3} />, <StepConfirm key={4} />];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={back} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <ProgressBar />

      <div className="px-6 pb-6 flex-1">
        {stepContent[step]}
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
        {step < 4 ? (
          <button disabled={!canNext()} onClick={next}
            className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button disabled={loading || !agreedToTerms} onClick={handleSubmit}
            className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity">
            {loading ? "Saving..." : "Confirm Booking →"}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
