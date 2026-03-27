import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Check, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, addDays, getDay } from "date-fns";
import { cn } from "@/lib/utils";

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
// JS getDay(): 0=Sun,1=Mon,...6=Sat → to our index: Mon=0..Sun=6
const jsDayToIdx = (jsDay: number) => (jsDay + 6) % 7;

const TIER_LABELS: Record<string, string> = { duo: "Cooq Duo", family: "Cooq Family", large: "Cooq Large" };
const FREQ_LABELS: Record<string, string> = { "one-time": "One-time", weekly: "Weekly", twice: "Twice a week", three: "3× a week" };
const TIER_PARTY: Record<string, number> = { duo: 2, family: 4, large: 6 };

const getTotal = (tier: string, freq: string, first: boolean): number => {
  const key = first && tier === "duo" && freq === "one-time" ? "first-cook" : freq;
  return PRICES[key]?.[tier] ?? 350;
};

const requiredDayCount = (freq: string) => {
  if (freq === "twice") return 2;
  if (freq === "three") return 3;
  if (freq === "weekly") return 1;
  return 0; // one-time uses date picker only
};

/* ─── COMPONENT ─── */
const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const { booking, updateBooking } = useBooking();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Step 1 — Tier
  const [tier, setTier] = useState("duo");
  const [isFirstSession, setIsFirstSession] = useState(false);

  // Step 2 — Frequency
  const [frequency, setFrequency] = useState("one-time");

  // Step 3 — Dates
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [secondSessionMenuId, setSecondSessionMenuId] = useState("");
  const [availableMenus, setAvailableMenus] = useState<Array<{ id: string; menu_name: string }>>([]);

  // Cook availability
  const [cookAvailableDays, setCookAvailableDays] = useState<number[]>([]); // 0=Mon..6=Sun
  const [cookAvailableLoaded, setCookAvailableLoaded] = useState(false);

  // Step 5 — Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const minDate = useMemo(() => addDays(new Date(), 2), []);

  const primaryMenuName = routerState.selectedMenuName || booking.menuSelected || "Not selected";
  const secondaryMenuName = availableMenus.find(m => m.id === secondSessionMenuId)?.menu_name || "";
  const sessionTotal = getTotal(tier, frequency, isFirstSession);
  const isDiscovery = isFirstSession && tier === "duo";
  const cookInitials = routerState.cookInitials || "TBD";

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
          // day_of_week in DB: 0=Mon..6=Sun (matching our index)
          const available = data.filter(d => d.available !== false).map(d => d.day_of_week);
          setCookAvailableDays(available);
        } else {
          // No availability records = all days available
          setCookAvailableDays([0, 1, 2, 3, 4, 5, 6]);
        }
        setCookAvailableLoaded(true);
      });
    return () => { active = false; };
  }, [routerState.cookId, booking.cookId]);

  // Check if a JS Date falls on an available cook day
  const isDateAvailable = (date: Date): boolean => {
    if (!cookAvailableLoaded) return true;
    const idx = jsDayToIdx(getDay(date));
    return cookAvailableDays.includes(idx);
  };

  // Available day names for day-of-week selectors
  const availableDayNames = cookAvailableDays.map(i => DAY_NAMES[i]);

  /* ─── NAVIGATION ─── */
  const neededDays = requiredDayCount(frequency);

  const canNext = (): boolean => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) {
      if (frequency === "one-time") return !!startDate;
      // recurring: need start date + correct number of days
      if (!startDate) return false;
      if (selectedDays.length < neededDays) return false;
      if (frequency === "twice" && !secondSessionMenuId) return false;
      return true;
    }
    if (step === 3) {
      return !!(booking.customerName.trim() && booking.email.trim() && booking.phone.trim());
    }
    return true;
  };

  const next = () => { if (step < 4) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); else navigate(-1); };

  /* ─── SUBMIT ─── */
  const handleSubmit = async () => {
    if (!agreedToTerms) return;
    setSubmitError("");
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) {
      toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      sessionStorage.setItem("cooq_last_submit", String(Date.now()));
      const recurringDays = selectedDays.length > 0 ? selectedDays : (startDate ? [DAY_NAMES[jsDayToIdx(getDay(startDate))]] : []);
      const sessionNotes = frequency === "twice"
        ? JSON.stringify({ recurring_days: recurringDays, secondary_session: { menu_id: secondSessionMenuId || null, menu_name: secondaryMenuName || null } })
        : recurringDays.length > 1 ? JSON.stringify({ recurring_days: recurringDays }) : null;

      const bookingDate = startDate ? format(startDate, "yyyy-MM-dd") : null;

      const insertData: any = {
        customer_name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        area: booking.location || routerState.cookArea || "",
        address: booking.address,
        cook_id: routerState.cookId || booking.cookId || "unassigned",
        cook_name: routerState.cookInitials || booking.cookName || "To be assigned",
        menu_selected: primaryMenuName,
        booking_date: bookingDate,
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
      navigate("/confirmation", {
        state: {
          bookingId: newBooking.id,
          totalAed: sessionTotal,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.email,
          bookingDate,
          menuSelected: primaryMenuName,
          cookName: newBooking.cook_name || null,
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
      {isDiscovery && <p className="font-body text-xs text-accent ml-6">AED 299 discovery rate applied</p>}
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
            <button key={f.key} type="button" onClick={() => { setFrequency(f.key); setSelectedDays([]); setSecondSessionMenuId(""); }}
              className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <p className="font-body text-base font-bold text-foreground">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{f.sub}</p>
              {selected && <Check className="w-5 h-5 text-primary mt-2" />}
            </button>
          );
        })}
      </div>
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
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else if (selectedDays.length < neededDays) {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const StepDates = () => {
    const isRecurring = frequency !== "one-time";

    return (
      <div className="space-y-5">
        <h2 className="font-display italic text-xl text-foreground">
          Choose your session date{isRecurring ? "s" : ""}
        </h2>

        {/* For recurring: day-of-week selector */}
        {isRecurring && (
          <div>
            <p className="font-body text-sm font-medium text-foreground mb-2">
              Select {neededDays} day{neededDays > 1 ? "s" : ""} of the week
            </p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day, idx) => {
                const available = cookAvailableDays.includes(idx);
                const selected = selectedDays.includes(day);
                return (
                  <button key={day} type="button" disabled={!available}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition ${
                      !available ? "opacity-25 cursor-not-allowed bg-muted text-muted-foreground" :
                      selected ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}>
                    {day}
                  </button>
                );
              })}
            </div>
            {selectedDays.length < neededDays && (
              <p className="font-body text-xs text-muted-foreground mt-1.5">
                {selectedDays.length}/{neededDays} selected
              </p>
            )}
          </div>
        )}

        {/* Start date / session date picker */}
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
            {isRecurring ? "Start date" : "Session date"}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline"
                className={cn("w-full justify-start text-left font-normal font-body", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "EEEE, d MMMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => {
                  if (date < minDate) return true;
                  if (!isDateAvailable(date)) return true;
                  // For recurring, only allow dates on selected days
                  if (isRecurring && selectedDays.length > 0) {
                    const dayName = DAY_NAMES[jsDayToIdx(getDay(date))];
                    if (!selectedDays.includes(dayName)) return true;
                  }
                  return false;
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Recurring summary label */}
        {isRecurring && startDate && selectedDays.length === neededDays && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="font-body text-sm text-foreground">
              Every <span className="font-semibold">{selectedDays.slice(0, -1).join(", ")}{selectedDays.length > 1 ? " + " : ""}{selectedDays[selectedDays.length - 1]}</span>, starting{" "}
              <span className="font-semibold">{format(startDate, "d MMMM yyyy")}</span>
            </p>
          </div>
        )}

        {/* Second menu selector for 2x or 3x */}
        {(frequency === "twice" || frequency === "three") && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="font-body text-sm font-semibold text-foreground">Second menu (for alternate sessions)</p>
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
        )}
      </div>
    );
  };

  /* ─── STEP 4: DETAILS ─── */
  const StepDetails = () => (
    <div className="space-y-4">
      <h2 className="font-display italic text-xl text-foreground">Your details</h2>

      <FieldInput label="Full name *" value={booking.customerName} readOnly={!!user?.user_metadata?.full_name}
        onChange={v => updateBooking({ customerName: v })} />
      <FieldInput label="Email *" type="email" value={booking.email} readOnly={!!user?.email}
        onChange={v => updateBooking({ email: v })} />

      {/* Phone field — single controlled input with +971 prefix */}
      <div>
        <label className="font-body text-sm font-medium text-foreground mb-1 block">Phone *</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted font-body text-sm text-muted-foreground">+971</span>
          <input
            type="tel"
            value={booking.phone.replace(/^\+971\s?/, "")}
            onChange={e => updateBooking({ phone: "+971 " + e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="50 123 4567"
            className="flex-1 p-3 rounded-r-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

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
  const formatDateDisplay = (d: Date | undefined) => d ? format(d, "EEEE, d MMMM yyyy") : "—";

  const StepConfirm = () => (
    <div className="space-y-5">
      <h2 className="font-display italic text-xl text-foreground">Review your booking</h2>

      <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden">
        <div className="p-5 space-y-0">
          <SummaryRow label="Cook" value={`${cookInitials}${routerState.cookArea ? " · " + routerState.cookArea : ""}`} />
          <Divider />
          <SummaryRow label="Menu" value={primaryMenuName} />
          {(frequency === "twice" || frequency === "three") && secondaryMenuName && (
            <>
              <Divider />
              <SummaryRow label="2nd Menu" value={secondaryMenuName} />
            </>
          )}
          <Divider />
          <SummaryRow label="Tier" value={TIER_LABELS[tier] || tier} />
          <Divider />
          <SummaryRow label="Frequency" value={FREQ_LABELS[frequency] || frequency} />
          <Divider />
          {frequency === "one-time" ? (
            <SummaryRow label="Date" value={formatDateDisplay(startDate)} />
          ) : (
            <>
              <SummaryRow label="Days" value={selectedDays.join(" + ")} />
              <Divider />
              <SummaryRow label="Starting" value={formatDateDisplay(startDate)} />
            </>
          )}
          <Divider />
          <SummaryRow label="Address" value={[booking.address, booking.location].filter(Boolean).join(", ") || "—"} />
          <Divider />
          <div className="flex justify-between items-center py-3">
            <span className="font-body text-base font-semibold text-muted-foreground">Price</span>
            <span className="font-display text-xl font-bold" style={{ color: "#B57E5D" }}>
              AED {sessionTotal.toLocaleString()}{frequency !== "one-time" ? " /mo" : ""}
            </span>
          </div>
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

      {submitError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <p className="font-body text-sm text-destructive">{submitError}</p>
        </div>
      )}
    </div>
  );

  const Divider = () => <div className="h-px bg-border/60" />;

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2.5">
      <span className="font-body text-sm text-muted-foreground">{label}</span>
      <span className="font-body text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
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
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={back} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <ProgressBar />

      <div className="px-6 pb-6 flex-1">
        {stepContent[step]}
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
        {step < 4 ? (
          <button disabled={!canNext()} onClick={next}
            className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button disabled={loading || !agreedToTerms} onClick={handleSubmit}
            className="w-full py-4 rounded-xl font-body font-semibold text-base disabled:opacity-40 transition-opacity text-white"
            style={{ backgroundColor: "#B57E5D" }}>
            {loading ? "Saving..." : "Confirm Booking →"}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
