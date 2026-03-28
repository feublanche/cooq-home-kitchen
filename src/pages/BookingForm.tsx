import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, getDay } from "date-fns";
import { cn } from "@/lib/utils";

/* ─── CONSTANTS ─── */
const PRICES: Record<string, Record<string, number>> = {
  "one-time": { duo: 350, family: 420, large: 550 },
  "first-cook": { duo: 299, family: 420, large: 550 },
  weekly: { duo: 1190, family: 1430, large: 1870 },
  twice: { duo: 2380, family: 2860, large: 3740 },
  three: { duo: 3570, family: 4280, large: 5610 },
};

const TIERS = [
  { key: "duo", label: "Cooq Duo", people: "1–2 people", duration: "~2 hrs", detail: "2 proteins · 2 sides", price: 350 },
  { key: "family", label: "Cooq Family", people: "3–4 people", duration: "~3 hrs", detail: "2 proteins · 3 sides", price: 420 },
  { key: "large", label: "Cooq Large", people: "5–6 people", duration: "~4 hrs", detail: "3 proteins · 3 sides", price: 550 },
] as const;

const FREQUENCIES = [
  { key: "one-time", label: "Once", sub: "Single session" },
  { key: "weekly", label: "Weekly", sub: "Save 15% · 4/mo" },
  { key: "twice", label: "Twice a week", sub: "Save 15% · 8/mo" },
  { key: "three", label: "3× a week", sub: "Save 15% · 12/mo" },
] as const;

const TIME_SLOTS = ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const jsDayToIdx = (jsDay: number) => (jsDay + 6) % 7;

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

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Selections
  const [tier, setTier] = useState("");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [dates, setDates] = useState<(Date | undefined)[]>([undefined, undefined, undefined]);
  const [timeSlots, setTimeSlots] = useState<string[]>(["", "", ""]);
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [building, setBuilding] = useState("");
  const [phone, setPhone] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [secondMenuId, setSecondMenuId] = useState("");
  const [availableMenus, setAvailableMenus] = useState<Array<{ id: string; menu_name: string }>>([]);

  // Cook availability
  const [cookAvailableDays, setCookAvailableDays] = useState<number[]>([]);
  const [cookAvailableLoaded, setCookAvailableLoaded] = useState(false);

  // Refs for scroll
  const freqRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  const minDate = useMemo(() => addDays(new Date(), 2), []);
  const primaryMenuName = routerState.selectedMenuName || booking.menuSelected || "Not selected";
  const cookInitials = routerState.cookInitials || "TBD";

  const numCalendars = frequency === "twice" ? 2 : frequency === "three" ? 3 : 1;
  const sessionTotal = tier ? getTotal(tier, frequency || "one-time", isFirstSession) : 0;

  // Pre-fill area from search session
  const searchState = (() => {
    try { return JSON.parse(sessionStorage.getItem("cooq_search_state") || "{}"); } catch { return {}; }
  })();

  // Fetch user
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

  // Fetch cook menus
  useEffect(() => {
    const cookId = routerState.cookId || booking.cookId;
    if (!cookId) return;
    let active = true;
    supabase.from("cook_menus").select("id, menu_name").eq("cook_id", cookId).eq("status", "approved")
      .then(({ data }) => { if (active) setAvailableMenus((data || []) as any); });
    return () => { active = false; };
  }, [routerState.cookId, booking.cookId]);

  // Fetch cook availability
  useEffect(() => {
    const cookId = routerState.cookId || booking.cookId;
    if (!cookId) return;
    let active = true;
    supabase.from("cook_availability").select("day_of_week, available").eq("cook_id", cookId)
      .then(({ data }) => {
        if (!active) return;
        if (data && data.length > 0) {
          setCookAvailableDays(data.filter(d => d.available !== false).map(d => d.day_of_week));
        } else {
          setCookAvailableDays([0, 1, 2, 3, 4, 5, 6]);
        }
        setCookAvailableLoaded(true);
      });
    return () => { active = false; };
  }, [routerState.cookId, booking.cookId]);

  const isDateAvailable = (date: Date): boolean => {
    if (!cookAvailableLoaded) return true;
    return cookAvailableDays.includes(jsDayToIdx(getDay(date)));
  };

  // Scroll helpers
  useEffect(() => {
    if (tier && freqRef.current) freqRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tier]);
  useEffect(() => {
    if (frequency && dateRef.current) dateRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [frequency]);

  // Address complete check
  const addressComplete = streetNumber.trim() && streetName.trim() && building.trim() && phone.replace(/[^0-9]/g, "").length >= 7;

  // Can submit
  const allDatesSelected = dates.slice(0, numCalendars).every(d => !!d);
  const allTimesSelected = timeSlots.slice(0, numCalendars).every(t => !!t);
  const canSubmit = tier && frequency && allDatesSelected && allTimesSelected && addressComplete && agreedToTerms &&
    (numCalendars <= 1 || secondMenuId);

  const secondaryMenuName = availableMenus.find(m => m.id === secondMenuId)?.menu_name || "";

  /* ─── SUBMIT ─── */
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError("");
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) {
      toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      sessionStorage.setItem("cooq_last_submit", String(Date.now()));
      const bookingDate = dates[0] ? format(dates[0], "yyyy-MM-dd") : null;
      const recurringDays = dates.slice(0, numCalendars).filter(Boolean).map(d => DAY_NAMES[jsDayToIdx(getDay(d!))]);
      const sessionNotes = numCalendars > 1
        ? JSON.stringify({
          recurring_days: recurringDays,
          time_slots: timeSlots.slice(0, numCalendars),
          secondary_session: numCalendars >= 2 ? { menu_id: secondMenuId || null, menu_name: secondaryMenuName || null } : undefined,
          dates: dates.slice(0, numCalendars).map(d => d ? format(d, "yyyy-MM-dd") : null),
        })
        : JSON.stringify({ time_slot: timeSlots[0] });

      const fullAddress = [streetNumber, streetName, building].filter(Boolean).join(", ");
      const fullPhone = "+971 " + phone.replace(/[^0-9]/g, "");

      const insertData: any = {
        customer_name: booking.customerName,
        email: booking.email,
        phone: fullPhone,
        area: searchState.neighborhood || booking.location || routerState.cookArea || "",
        address: fullAddress,
        cook_id: routerState.cookId || booking.cookId || "unassigned",
        cook_name: routerState.cookInitials || booking.cookName || "To be assigned",
        menu_selected: primaryMenuName,
        booking_date: bookingDate,
        frequency: frequency || "one-time",
        party_size: TIER_PARTY[tier] || 2,
        dietary: booking.dietary,
        allergies_notes: dietaryNotes.trim() || "",
        session_notes: sessionNotes,
        grocery_addon: false,
        grocery_fee: 0,
        tier,
        session_type: isFirstSession && tier === "duo" ? "discovery" : "standard",
        total_aed: sessionTotal,
        status: "pending",
        customer_user_id: user?.id || null,
        selected_menu_id: routerState.selectedMenuId || null,
      };

      const { data: newBooking, error } = await supabase.from("bookings").insert(insertData).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");

      // Navigate to payment
      navigate("/payment", {
        state: {
          bookingId: newBooking.id,
          totalAed: sessionTotal,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.email,
          area: newBooking.area,
          bookingDate,
          bookingTime: timeSlots[0],
          menuSelected: primaryMenuName,
          cookName: newBooking.cook_name,
          cookId: routerState.cookId || booking.cookId,
          selectedMenuName: primaryMenuName,
          secondaryBookingDate: dates[1] ? format(dates[1], "yyyy-MM-dd") : null,
          secondaryMenuName: secondaryMenuName || null,
          recurringDays: JSON.stringify(recurringDays),
          frequency,
        },
      });
    } catch (err: any) {
      console.error("Booking error:", err);
      setSubmitError(err?.message || "Something went wrong. Please try again or contact hello@cooq.ae");
    } finally {
      setLoading(false);
    }
  };

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      {/* Sticky summary bar */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-6 py-3">
        <p className="font-body text-sm text-foreground">
          Booking with <span className="font-semibold">{cookInitials}</span> · <span className="text-copper font-medium">{primaryMenuName}</span>
        </p>
      </div>

      <div className="flex-1 px-6 pb-32 space-y-8 pt-4">
        {/* SECTION 1: Tier */}
        <div>
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Session size</p>
          <div className="space-y-3">
            {TIERS.map(t => {
              const selected = tier === t.key;
              const price = getTotal(t.key, frequency || "one-time", isFirstSession && t.key === "duo");
              return (
                <button key={t.key} type="button" onClick={() => { setTier(t.key); if (t.key !== "duo") setIsFirstSession(false); }}
                  className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-body text-base font-bold text-foreground">{t.label}</p>
                      <p className="font-body text-sm text-muted-foreground mt-0.5">{t.people} · {t.duration}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                    <p className="font-display text-lg font-bold text-accent">AED {price}</p>
                  </div>
                  {selected && <Check className="w-5 h-5 text-primary mt-2" />}
                </button>
              );
            })}
          </div>
          {tier === "duo" && (
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
              <input type="checkbox" checked={isFirstSession} onChange={e => setIsFirstSession(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary" />
              <span className="font-body text-sm text-foreground">This is my first Cooq session</span>
            </label>
          )}
          {isFirstSession && tier === "duo" && (
            <p className="font-body text-xs text-accent ml-6 mt-1">AED 299 discovery rate applied</p>
          )}
        </div>

        {/* SECTION 2: Frequency */}
        {tier && (
          <div ref={freqRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">How often?</p>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map(f => (
                <button key={f.key} type="button"
                  onClick={() => { setFrequency(f.key); setDates([undefined, undefined, undefined]); setTimeSlots(["", "", ""]); setSecondMenuId(""); }}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition border ${
                    frequency === f.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            {frequency && sessionTotal > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 mt-3">
                <p className="font-body text-sm text-muted-foreground">{TIER_LABELS[tier]} · {FREQ_LABELS[frequency]}</p>
                <p className="font-display text-xl font-bold text-accent mt-1">
                  AED {sessionTotal.toLocaleString()}{frequency !== "one-time" ? " /mo" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Dates + Times */}
        {tier && frequency && (
          <div ref={dateRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">
              Choose your date{numCalendars > 1 ? "s" : ""} & time{numCalendars > 1 ? "s" : ""}
            </p>
            {Array.from({ length: numCalendars }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                {numCalendars > 1 && (
                  <p className="font-body text-sm font-semibold text-foreground">Session {idx + 1}</p>
                )}
                <Calendar
                  mode="single"
                  selected={dates[idx]}
                  onSelect={(d) => {
                    const next = [...dates];
                    next[idx] = d;
                    setDates(next);
                  }}
                  disabled={(date) => {
                    if (date < minDate) return true;
                    if (!isDateAvailable(date)) return true;
                    return false;
                  }}
                  className={cn("p-3 pointer-events-auto rounded-xl border border-border bg-card")}
                />
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-2">Time slot</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button key={slot} type="button" onClick={() => {
                        const next = [...timeSlots];
                        next[idx] = slot;
                        setTimeSlots(next);
                      }}
                        className={`px-4 py-2 rounded-full text-sm transition border ${
                          timeSlots[idx] === slot ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Second menu for 2x or 3x */}
            {numCalendars >= 2 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="font-body text-sm font-semibold text-foreground">Second menu (for alternate sessions)</p>
                {availableMenus.length > 0 ? (
                  <select value={secondMenuId} onChange={e => setSecondMenuId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select menu</option>
                    {availableMenus.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder="Describe your preferred menu" value={secondMenuId}
                    onChange={e => setSecondMenuId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Address */}
        {tier && frequency && allDatesSelected && allTimesSelected && (
          <div ref={addressRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Your address</p>

            {/* Pre-filled area */}
            {searchState.neighborhood && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="font-body text-sm text-foreground">📍 {searchState.neighborhood}</p>
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Number *</label>
              <input type="text" value={streetNumber} onChange={e => setStreetNumber(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!streetNumber.trim() && tier && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Name *</label>
              <input type="text" value={streetName} onChange={e => setStreetName(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!streetName.trim() && tier && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Building / Villa / Floor / Apt *</label>
              <input type="text" value={building} onChange={e => setBuilding(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!building.trim() && tier && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Phone number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted font-body text-sm text-muted-foreground">+971</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="50 123 4567"
                  className="flex-1 p-3 rounded-r-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {phone.replace(/[^0-9]/g, "").length < 7 && tier && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>
          </div>
        )}

        {/* SECTION 5: Summary + Confirm */}
        <div className="space-y-4">
          {tier && frequency && (
            <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden p-5 space-y-0">
              <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Booking summary</p>
              <SummaryRow label="Cook" value={cookInitials} />
              <Divider />
              <SummaryRow label="Menu" value={primaryMenuName} />
              {secondaryMenuName && (<><Divider /><SummaryRow label="2nd Menu" value={secondaryMenuName} /></>)}
              <Divider />
              <SummaryRow label="Tier" value={TIER_LABELS[tier] || tier} />
              <Divider />
              <SummaryRow label="Frequency" value={FREQ_LABELS[frequency] || frequency} />
              {dates[0] && (<><Divider /><SummaryRow label="Date" value={format(dates[0], "EEE, d MMM yyyy")} /></>)}
              {dates[1] && (<><Divider /><SummaryRow label="Date 2" value={format(dates[1], "EEE, d MMM yyyy")} /></>)}
              {dates[2] && (<><Divider /><SummaryRow label="Date 3" value={format(dates[2], "EEE, d MMM yyyy")} /></>)}
              <Divider />
              <div className="flex justify-between items-center py-3">
                <span className="font-body text-base font-semibold text-muted-foreground">Total</span>
                <span className="font-display text-xl font-bold text-accent">
                  AED {sessionTotal.toLocaleString()}{frequency !== "one-time" ? " /mo" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Dietary notes */}
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Dietary notes (optional)</label>
            <textarea value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)}
              placeholder="Any allergies, preferences, or special requests..."
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* T&C */}
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5" />
            <span>
              I agree to Cooq's{" "}
              <a href="/terms" target="_blank" className="text-primary underline">Terms & Conditions</a>{" "}and{" "}
              <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a>
            </span>
          </label>

          {/* Trust line */}
          <p className="font-body text-xs text-muted-foreground leading-relaxed">
            🔒 Secure payment · Cooq Vetted cook · Free reschedule anytime · Cancellation with full refund if requested 48hrs+ before session
          </p>

          {submitError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="font-body text-sm text-destructive">{submitError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-30">
        <div className="max-w-[430px] mx-auto">
          <button disabled={loading || !canSubmit} onClick={handleSubmit}
            className="w-full py-4 rounded-xl font-body font-semibold text-base disabled:opacity-40 transition-opacity text-accent-foreground bg-copper">
            {loading ? "Processing..." : `Confirm & Pay · AED ${sessionTotal.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const Divider = () => <div className="h-px bg-border/60" />;
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5">
    <span className="font-body text-sm text-muted-foreground">{label}</span>
    <span className="font-body text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
  </div>
);

export default BookingForm;
