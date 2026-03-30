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
const TIER_PRICE: Record<string, number> = { duo: 350, family: 420, large: 550 };


const TIERS = [
  { key: "duo", label: "Cooq Duo", people: "1–2 people", duration: "~2 hrs", detail: "2 proteins · 2 sides" },
  { key: "family", label: "Cooq Family", people: "3–4 people", duration: "~3 hrs", detail: "2 proteins · 3 sides" },
  { key: "large", label: "Cooq Large", people: "5–6 people", duration: "~4 hrs", detail: "3 proteins · 3 sides" },
] as const;

const FREQUENCIES = [
  { key: "weekly", label: "Once a week", sessions: 4 },
  { key: "twice", label: "Twice a week", sessions: 8 },
  { key: "three", label: "3× a week", sessions: 12 },
] as const;

const TIME_SLOTS = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const jsDayToIdx = (jsDay: number) => (jsDay + 6) % 7;

const TIER_LABELS: Record<string, string> = { duo: "Cooq Duo", family: "Cooq Family", large: "Cooq Large" };
const FREQ_LABELS: Record<string, string> = { weekly: "Once a week", twice: "Twice a week", three: "3× a week" };
const TIER_PARTY: Record<string, number> = { duo: 2, family: 4, large: 6 };

const getTotal = (tier: string, freq: string): number => {
  const base = TIER_PRICE[tier] ?? 350;
  const sessions = freq === "twice" ? 8 : freq === "three" ? 12 : 4;
  return base * sessions;
};

/* ─── COMPONENT ─── */
const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const { booking, updateBooking } = useBooking();

  // Redirect if no cook/menu passed
  const cookId = routerState.cookId || booking.cookId;
  const cookInitials = routerState.cookInitials || "TBD";
  const primaryMenuName = routerState.selectedMenuName || booking.menuSelected || "";

  useEffect(() => {
    if (!cookId || !primaryMenuName) {
      toast({ title: "Please select a cook first.", variant: "destructive" });
      navigate("/search", { replace: true });
    }
  }, [cookId, primaryMenuName, navigate]);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Selections
  const [tier, setTier] = useState("");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [frequency, setFrequency] = useState("");

  // Day-of-week selections (indices 0-6 = Mon-Sun)
  const numDayPicks = frequency === "twice" ? 2 : frequency === "three" ? 3 : 1;
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

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
  const sessionTotal = tier ? getTotal(tier, frequency || "weekly", isFirstSession) : 0;

  // Pre-fill area from search session
  const searchNeighborhood = (() => {
    try { return JSON.parse(sessionStorage.getItem("cooq_search_state") || "{}").neighborhood || ""; } catch { return ""; }
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
    if (!cookId) return;
    let active = true;
    supabase.from("cook_menus").select("id, menu_name").eq("cook_id", cookId).eq("status", "approved")
      .then(({ data }) => { if (active) setAvailableMenus((data || []) as any); });
    return () => { active = false; };
  }, [cookId]);

  // Fetch cook availability
  useEffect(() => {
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
  }, [cookId]);

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

  // Toggle day selection
  const toggleDay = (dayIdx: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIdx)) return prev.filter(d => d !== dayIdx);
      if (prev.length >= numDayPicks) return [...prev.slice(1), dayIdx];
      return [...prev, dayIdx];
    });
  };

  // Address complete check
  const addressComplete = streetNumber.trim() && streetName.trim() && building.trim() && phone.replace(/[^0-9]/g, "").length >= 7;

  // Days + times complete
  const daysComplete = selectedDays.length === numDayPicks;
  const timesComplete = selectedTimes.length === numDayPicks && selectedTimes.every(t => !!t);
  const dateComplete = daysComplete && timesComplete && !!startDate;

  // Can submit
  const canSubmit = tier && frequency && dateComplete && addressComplete && agreedToTerms &&
    (numDayPicks <= 1 || secondMenuId);

  const secondaryMenuName = availableMenus.find(m => m.id === secondMenuId)?.menu_name || "";

  // Day labels for summary
  const dayLabels = selectedDays.map(d => DAY_NAMES[d]);
  const summaryDaysText = dayLabels.length === 1
    ? `Every ${dayLabels[0]}`
    : dayLabels.length === 2
    ? `Every ${dayLabels[0]} + ${dayLabels[1]}`
    : `Every ${dayLabels[0]}, ${dayLabels[1]} + ${dayLabels[2]}`;

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
      const bookingDate = startDate ? format(startDate, "yyyy-MM-dd") : null;
      const recurringDays = dayLabels;
      const sessionNotes = JSON.stringify({
        recurring_days: recurringDays,
        time_slots: selectedTimes.slice(0, numDayPicks),
        start_date: bookingDate,
        secondary_session: numDayPicks >= 2 ? { menu_id: secondMenuId || null, menu_name: secondaryMenuName || null } : undefined,
      });

      const fullAddress = [streetNumber, streetName, building].filter(Boolean).join(", ");
      const fullPhone = "+971 " + phone.replace(/[^0-9]/g, "");

      const insertData: any = {
        customer_name: booking.customerName,
        email: booking.email,
        phone: fullPhone,
        area: searchNeighborhood || booking.location || routerState.cookArea || "",
        address: fullAddress,
        cook_id: cookId || "unassigned",
        cook_name: cookInitials,
        menu_selected: primaryMenuName,
        booking_date: bookingDate,
        frequency: frequency || "weekly",
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

      navigate("/payment", {
        state: {
          bookingId: newBooking.id,
          totalAed: sessionTotal,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.email,
          area: newBooking.area,
          bookingDate,
          bookingTime: selectedTimes[0],
          menuSelected: primaryMenuName,
          cookName: cookInitials,
          cookId,
          selectedMenuName: primaryMenuName,
          recurringDays: JSON.stringify(dayLabels),
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

  if (!cookId || !primaryMenuName) return null;

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
              const price = TIER_PRICE[t.key];
              return (
                <button key={t.key} type="button" onClick={() => { setTier(t.key); if (t.key !== "duo") setIsFirstSession(false); }}
                  className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-body text-base font-bold text-foreground">{t.label}</p>
                      <p className="font-body text-sm text-muted-foreground mt-0.5">{t.people} · {t.duration}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                    <p className="font-display text-lg font-bold text-copper">AED {price}</p>
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
            <p className="font-body text-xs text-copper ml-6 mt-1">AED 299 discovery rate applied per session</p>
          )}
        </div>

        {/* SECTION 2: Frequency */}
        {tier && (
          <div ref={freqRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">How often?</p>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map(f => (
                <button key={f.key} type="button"
                  onClick={() => { setFrequency(f.key); setSelectedDays([]); setSelectedTimes([]); setStartDate(undefined); setSecondMenuId(""); }}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition border ${
                    frequency === f.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: Day + Time pickers */}
        {tier && frequency && (
          <div ref={dateRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">
              Choose your day{numDayPicks > 1 ? "s" : ""} & time{numDayPicks > 1 ? "s" : ""}
            </p>

            {/* Day-of-week selectors */}
            {Array.from({ length: numDayPicks }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                {numDayPicks > 1 && (
                  <p className="font-body text-sm font-semibold text-foreground">Session {idx + 1}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, dayIdx) => {
                    const available = cookAvailableDays.includes(dayIdx);
                    const isSelected = selectedDays[idx] === dayIdx;
                    const takenByOther = selectedDays.includes(dayIdx) && selectedDays[idx] !== dayIdx;
                    return (
                      <button key={name} type="button" disabled={!available || takenByOther}
                        onClick={() => {
                          setSelectedDays(prev => {
                            const next = [...prev];
                            next[idx] = dayIdx;
                            return next.slice(0, numDayPicks);
                          });
                        }}
                        className={`px-4 py-2.5 rounded-full text-sm transition border ${
                          isSelected ? "border-primary bg-primary/10 text-primary font-semibold"
                          : !available || takenByOther ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                          : "border-border bg-card text-foreground"
                        }`}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground mb-2">Time slot</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button key={slot} type="button" onClick={() => {
                        setSelectedTimes(prev => {
                          const next = [...prev];
                          next[idx] = slot;
                          return next.slice(0, numDayPicks);
                        });
                      }}
                        className={`px-4 py-2 rounded-full text-sm transition border ${
                          selectedTimes[idx] === slot ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Start date picker */}
            {daysComplete && timesComplete && (
              <div className="space-y-2">
                <p className="font-body text-sm font-semibold text-foreground">Starting from</p>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => {
                    if (date < minDate) return true;
                    if (!isDateAvailable(date)) return true;
                    return false;
                  }}
                  className={cn("p-3 pointer-events-auto rounded-xl border border-border bg-card")}
                />
                {startDate && (
                  <p className="font-body text-sm text-primary font-medium mt-1">
                    {summaryDaysText}, starting {format(startDate, "d MMM yyyy")}
                  </p>
                )}
              </div>
            )}

            {/* Second menu for 2x or 3x */}
            {numDayPicks >= 2 && (
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
        {tier && frequency && dateComplete && (
          <div ref={addressRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Your address</p>

            {searchNeighborhood && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="font-body text-sm text-foreground">📍 {searchNeighborhood}</p>
              </div>
            )}

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Number *</label>
              <input type="text" value={streetNumber} onChange={e => setStreetNumber(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!streetNumber.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Name *</label>
              <input type="text" value={streetName} onChange={e => setStreetName(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!streetName.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Building / Villa / Floor / Apt *</label>
              <input type="text" value={building} onChange={e => setBuilding(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              {!building.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1 block">Phone number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted font-body text-sm text-muted-foreground">+971</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="50 123 4567"
                  className="flex-1 p-3 rounded-r-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {phone.replace(/[^0-9]/g, "").length < 7 && <p className="text-xs text-destructive mt-1">Required</p>}
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
              {selectedDays.length > 0 && (<><Divider /><SummaryRow label="Days" value={summaryDaysText} /></>)}
              {startDate && (<><Divider /><SummaryRow label="Starting" value={format(startDate, "EEE, d MMM yyyy")} /></>)}
              <Divider />
              <div className="flex justify-between items-center py-3">
                <span className="font-body text-base font-semibold text-muted-foreground">Total</span>
                <span className="font-display text-xl font-bold text-copper">
                  AED {sessionTotal.toLocaleString()} /month
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
            🔒 Secure payment · Cooq Certified cook · Free reschedule anytime · Cancellation with full refund if requested 48hrs+ before session
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
            {loading ? "Processing..." : `Confirm & Pay · AED ${sessionTotal.toLocaleString()}/month`}
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
