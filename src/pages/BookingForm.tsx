import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Info, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import type { User } from "@supabase/supabase-js";

const steps = ["Preferences", "Match", "Profile", "Details", "Confirm"];

const PRICES: Record<string, Record<string, number>> = {
  'one-time':   { duo: 350,  family: 420,  large: 550  },
  'first-cook': { duo: 299,  family: 420,  large: 550  },
  'weekly':     { duo: 1190, family: 1430, large: 1870 },
  'twice':      { duo: 2380, family: 2860, large: 3740 },
  'three':      { duo: 3570, family: 4280, large: 5610 }
};

const SESSIONS: Record<string, number> = {
  'one-time': 1, 'first-cook': 1,
  'weekly': 4, 'twice': 8, 'three': 12
};

const SAVINGS: Record<string, Record<string, number>> = {
  'weekly': { duo: 210, family: 250, large: 330  },
  'twice':  { duo: 420, family: 500, large: 660  },
  'three':  { duo: 630, family: 760, large: 990  }
};

const TIER_LIMITS: Record<string, { min: number; max: number }> = {
  duo:    { min: 1, max: 2 },
  family: { min: 3, max: 4 },
  large:  { min: 5, max: 6 },
};

const TIER_HINTS: Record<string, string> = {
  duo:    "Duo sessions are for 1–2 people",
  family: "Family sessions are for 3–4 people",
  large:  "Large sessions are for 5–6 people",
};

const TIERS = [
  { key: "duo", label: "Cooq Duo", people: "1–2 people · ~2 hours", detail: "2 proteins · 2 sides · covers 3–4 days", price: 350, discoveryPrice: 299 },
  { key: "family", label: "Cooq Family", people: "3–4 people · ~3 hours", detail: "2 proteins · 3 sides · covers 3–4 days", price: 420, discoveryPrice: null },
  { key: "large", label: "Cooq Large", people: "5–6 people · ~4 hours", detail: "3 proteins · 3 sides · covers 3–4 days", price: 550, discoveryPrice: null },
] as const;

const FREQUENCIES = [
  { key: "one-time", label: "One-time" },
  { key: "weekly", label: "Weekly · Save 15%" },
  { key: "twice", label: "Twice a week" },
  { key: "three", label: "3× a week" },
] as const;

const GROCERY_FEE = 75;

const getTotal = (tier: string, freq: string, first: boolean): number => {
  const key = (first && tier === 'duo' && freq === 'one-time') ? 'first-cook' : freq;
  return PRICES[key]?.[tier] ?? 350;
};

const FREQ_LABELS: Record<string, string> = {
  'one-time': 'One-time',
  'weekly': 'Weekly',
  'twice': 'Twice a week',
  'three': '3× a week',
};

const TIER_LABELS: Record<string, string> = {
  duo: 'Cooq Duo',
  family: 'Cooq Family',
  large: 'Cooq Large',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FormInput = ({
  label, value, onChange, placeholder, error, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; type?: string;
}) => (
  <div className="mb-4">
    <label className="font-body text-sm font-medium text-foreground mb-1 block">{label}</label>
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
    {error && <p className="font-body text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const { booking, updateBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasTier = !!routerState.tier;
  const hasFreq = !!routerState.frequency;

  const [tier, setTierRaw] = useState<string>(routerState.tier || "duo");
  const setTier = (newTier: string) => {
    setTierRaw(newTier);
    const limits = TIER_LIMITS[newTier];
    if (limits) updateBooking({ partySize: limits.min });
    if (newTier !== "duo") setIsFirstSession(false);
  };

  const [frequency, setFrequency] = useState<string>(routerState.frequency || "one-time");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Recurring day selectors for twice/three frequency
  const [secondDay, setSecondDay] = useState("");
  const [thirdDay, setThirdDay] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        if (u.user_metadata?.full_name && !booking.customerName) updateBooking({ customerName: u.user_metadata.full_name });
        if (u.email && !booking.email) updateBooking({ email: u.email });
      }
    });
  }, []);

  const selectedTier = TIERS.find((t) => t.key === tier)!;
  const isDiscovery = isFirstSession && tier === "duo";
  const sessionTotal = getTotal(tier, frequency, isFirstSession);
  const groceryFee = 0; // Grocery shopping removed for now

  // Primary weekday from booking date
  const primaryWeekday = routerState.bookingDate
    ? DAY_NAMES[(new Date(routerState.bookingDate).getDay() + 6) % 7]
    : "";

  const recurringDays = [primaryWeekday, secondDay, thirdDay].filter(Boolean);

  const formatBookingDate = (d: string) => {
    if (!d) return "Not selected";
    return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!booking.customerName.trim()) e.customerName = "Required";
    if (!booking.email.trim() || !/\S+@\S+\.\S+/.test(booking.email)) e.email = "Valid email required";
    if (!booking.phone.trim()) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) {
      toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" });
      return;
    }
    if (!sessionTotal || sessionTotal < 299 || sessionTotal > 6000) {
      toast({ title: "Invalid booking amount.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const sanitisedAllergyNotes = booking.allergyNotes?.replace(/<[^>]*>/g, "").trim() || "";
      sessionStorage.setItem("cooq_last_submit", String(Date.now()));
      const sessionType = isDiscovery ? "discovery" : "standard";
      const areaField = booking.location || routerState.cookArea || "";
      const insertData: any = {
        customer_name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        area: areaField,
        address: booking.address,
        cook_id: routerState.cookId || booking.cookId || "unassigned",
        cook_name: routerState.cookInitials || booking.cookName || "To be assigned",
        menu_selected: routerState.selectedMenuName || booking.menuSelected || "Not selected",
        booking_date: routerState.bookingDate || null,
        frequency,
        party_size: booking.partySize,
        dietary: booking.dietary,
        allergies_notes: sanitisedAllergyNotes,
        grocery_addon: booking.groceryAddon,
        grocery_fee: groceryFee,
        tier,
        session_type: sessionType,
        total_aed: sessionTotal,
        status: "pending",
        customer_user_id: user?.id || null,
        selected_menu_id: routerState.selectedMenuId || null,
      };
      const { data: newBooking, error } = await supabase.from("bookings").insert(insertData).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");
      updateBooking({ totalAed: sessionTotal });
      navigate("/payment", {
        state: {
          bookingId: newBooking.id,
          totalAed: sessionTotal,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.email,
          area: areaField,
          bookingDate: routerState.bookingDate,
          bookingTime: routerState.bookingTime,
          menuSelected: newBooking.menu_selected,
          cookName: newBooking.cook_name || null,
          cookId: routerState.cookId,
          selectedMenuName: routerState.selectedMenuName,
          recurringDays: JSON.stringify(recurringDays),
          frequency,
        },
      });
    } catch (err) {
      console.error("Booking error:", err);
      toast({ title: "Booking failed", description: "Something went wrong. Please try again or contact hello@cooq.ae", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 mb-4">
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full flex-1 ${i <= 3 ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((s, i) => (
            <span key={s} className={`font-body text-[10px] ${i <= 3 ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 flex-1">
        {/* ── SUMMARY CARD ── */}
        <div className="bg-[#86A383]/10 rounded-xl p-4 mb-5">
          <p className="font-body text-[14px] font-bold text-foreground">
            Cook: {routerState.cookInitials || "To be matched"}{routerState.cookArea ? ` · ${routerState.cookArea}` : ""}
          </p>
          <p className="font-body text-[12px] text-gray-500 italic">
            Menu: {routerState.selectedMenuName || "No menu selected"}
          </p>
          <p className="font-body text-[12px] text-gray-500">
            Date: {formatBookingDate(routerState.bookingDate)}
          </p>
          <p className="font-body text-[12px] text-gray-500">
            Time: {routerState.bookingTime || "Not selected"}
          </p>
          <p className="font-body text-[12px] text-gray-500">
            Tier: {TIER_LABELS[tier] || tier} · Frequency: {FREQ_LABELS[frequency] || frequency}
          </p>
          {recurringDays.length > 1 && (
            <p className="font-body text-[12px] text-gray-500">
              Weekly sessions: {recurringDays.join(" + ")}
            </p>
          )}
          <div className="mt-2">
            {frequency === "one-time" || frequency === "" ? (
              <p className="font-body text-[14px] font-bold" style={{ color: "#B57E5D" }}>
                AED {(sessionTotal + groceryFee).toLocaleString()}
                {groceryFee > 0 && <span className="font-normal text-xs text-gray-400 ml-1">(incl. AED 75 grocery)</span>}
              </p>
            ) : (
              <>
                <p className="font-body text-[14px] font-bold" style={{ color: "#B57E5D" }}>
                  AED {sessionTotal.toLocaleString()} / month
                </p>
                {groceryFee > 0 && (
                  <p className="font-body text-[11px] text-gray-500">+ AED 75 grocery service fee per session</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── TIER SELECTION ── */}
        {!hasTier && frequency === 'one-time' && (
          <>
            <p className="font-body text-sm font-bold text-foreground mb-3">Choose your session tier</p>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {TIERS.map((t) => {
                const selected = tier === t.key;
                const showDiscovery = isFirstSession && t.key === "duo";
                return (
                  <button key={t.key} type="button" onClick={() => setTier(t.key)}
                    className={`text-left rounded-xl p-4 border-2 transition cursor-pointer ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <p className="font-body text-sm font-bold text-foreground">{t.label}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">{t.people}</p>
                    <p className="font-body text-xs text-muted-foreground">{t.detail}</p>
                    <div className="mt-2">
                      <p className="font-body text-xs text-muted-foreground">Party of:</p>
                      <div className="flex items-center gap-2 mt-1">
                        {Array.from({ length: TIER_LIMITS[t.key].max - TIER_LIMITS[t.key].min + 1 }, (_, i) => TIER_LIMITS[t.key].min + i).map((n) => (
                          <button key={n} type="button"
                            onClick={(e) => { e.stopPropagation(); setTier(t.key); updateBooking({ partySize: n }); }}
                            className={`w-8 h-8 rounded-full text-xs font-semibold transition ${selected && booking.partySize === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      {showDiscovery ? (
                        <>
                          <p className="font-body text-sm font-bold" style={{ color: "#B57E5D" }}>AED 299</p>
                          <span className="font-body text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(181,126,93,0.15)", color: "#B57E5D" }}>First Cook trial</span>
                        </>
                      ) : (
                        <p className="font-body text-sm font-bold text-foreground">AED {t.price}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {!hasTier && frequency !== 'one-time' && frequency !== '' && (
          <>
            <p className="font-body text-sm font-bold text-foreground mb-3">Choose your session tier</p>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {TIERS.map((t) => {
                const selected = tier === t.key;
                return (
                  <button key={t.key} type="button" onClick={() => setTier(t.key)}
                    className={`text-left rounded-xl p-4 border-2 transition cursor-pointer ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-body text-sm font-bold text-foreground">{t.label} <span className="font-normal text-muted-foreground">· {t.people}</span></p>
                        <p className="font-body text-xs text-muted-foreground">{t.detail}</p>
                      </div>
                      <p className="font-body text-sm font-bold text-foreground">AED {t.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {hasTier && (
          <div className="mb-4 p-3 rounded-xl bg-card border border-border">
            <p className="font-body text-sm text-muted-foreground">Tier: <span className="font-semibold text-foreground">{TIER_LABELS[tier]}</span></p>
          </div>
        )}

        {/* First session checkbox */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 cursor-pointer ${tier !== "duo" ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}>
            <input type="checkbox" checked={isFirstSession} onChange={(e) => setIsFirstSession(e.target.checked)} disabled={tier !== "duo"} className="w-4 h-4 rounded border-border accent-primary" />
            <span className="font-body text-xs text-muted-foreground">This is my first Cooq session</span>
          </label>
          {tier === "duo" && isFirstSession && <p className="font-body text-xs mt-1" style={{ color: "#B57E5D" }}>AED 299 · First Cook trial</p>}
          {tier !== "duo" && <p className="font-body text-xs text-gray-400 italic mt-1">First Cook trial is only available for Duo sessions</p>}
        </div>

        {/* ── FREQUENCY ── */}
        {!hasFreq && (
          <>
            <p className="font-body text-sm font-bold text-foreground mb-3">How often?</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {FREQUENCIES.map((f) => {
                const selected = frequency === f.key;
                return (
                  <button key={f.key} type="button" onClick={() => setFrequency(f.key)}
                    className={`font-body text-xs px-4 py-2 rounded-full border transition ${selected ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground"}`}>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {hasFreq && (
          <div className="mb-4 p-3 rounded-xl bg-card border border-border">
            <p className="font-body text-sm text-muted-foreground">Frequency: <span className="font-semibold text-foreground">{FREQ_LABELS[frequency]}</span></p>
          </div>
        )}

        {/* Savings badge */}
        {isDiscovery ? (
          <p className="font-body text-xs mb-4 px-2 py-1 rounded inline-block" style={{ color: "#B57E5D", backgroundColor: "rgba(181,126,93,0.1)" }}>
            AED 299 · First Cook trial
          </p>
        ) : frequency !== "one-time" && SAVINGS[frequency] ? (
          <div className="mb-4">
            <p className="font-body text-xs px-2 py-1 rounded inline-block" style={{ color: "#86A383", backgroundColor: "rgba(134,163,131,0.1)" }}>
              You save AED {SAVINGS[frequency]?.[tier]} per month vs booking one-time
            </p>
            <p className="font-body text-[11px] text-muted-foreground mt-1">{SESSIONS[frequency]} sessions per month · 15% off</p>
          </div>
        ) : (
          <p className="font-body text-xs text-muted-foreground mb-4">AED {sessionTotal} per session</p>
        )}

        {/* ── RECURRING DAY SELECTORS ── */}
        {frequency === "twice" && (
          <div className="mb-6">
            <p className="font-body text-[13px] font-semibold text-foreground mb-2">Choose your second weekly day</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day) => {
                const disabled = day === primaryWeekday;
                const selected = secondDay === day;
                return (
                  <button key={day} type="button" disabled={disabled}
                    onClick={() => setSecondDay(day)}
                    className={`px-4 py-2 rounded-full text-sm transition ${disabled ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400" : selected ? "bg-[#86A383] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
            {recurringDays.length > 1 && (
              <p className="font-body text-xs text-muted-foreground mt-2">Weekly sessions: {recurringDays.join(" + ")}</p>
            )}
          </div>
        )}

        {frequency === "three" && (
          <div className="mb-6">
            <p className="font-body text-[13px] font-semibold text-foreground mb-2">Choose your two additional weekly days</p>
            <p className="font-body text-xs text-muted-foreground mb-2">Second day:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DAY_NAMES.map((day) => {
                const disabled = day === primaryWeekday || day === thirdDay;
                const selected = secondDay === day;
                return (
                  <button key={day} type="button" disabled={disabled}
                    onClick={() => setSecondDay(day)}
                    className={`px-4 py-2 rounded-full text-sm transition ${disabled ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400" : selected ? "bg-[#86A383] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="font-body text-xs text-muted-foreground mb-2">Third day:</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day) => {
                const disabled = day === primaryWeekday || day === secondDay;
                const selected = thirdDay === day;
                return (
                  <button key={day} type="button" disabled={disabled}
                    onClick={() => setThirdDay(day)}
                    className={`px-4 py-2 rounded-full text-sm transition ${disabled ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400" : selected ? "bg-[#86A383] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
            {recurringDays.length > 1 && (
              <p className="font-body text-xs text-muted-foreground mt-2">Weekly sessions: {recurringDays.join(" + ")}</p>
            )}
          </div>
        )}

        <div className="mb-6" />

        {/* ── FORM FIELDS ── */}
        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Full name *</label>
          <div className="relative">
            <input type="text" value={booking.customerName} readOnly={!!user?.user_metadata?.full_name}
              onChange={(e) => updateBooking({ customerName: e.target.value })}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10" />
            {user?.user_metadata?.full_name && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          {errors.customerName && <p className="font-body text-xs text-destructive mt-1">{errors.customerName}</p>}
        </div>
        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Email address *</label>
          <div className="relative">
            <input type="email" value={booking.email} readOnly={!!user?.email}
              onChange={(e) => updateBooking({ email: e.target.value })}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10" />
            {user?.email && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          {errors.email && <p className="font-body text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <FormInput label="Phone number *" value={booking.phone} onChange={(v) => updateBooking({ phone: v })} placeholder="+971" error={errors.phone} />
        <FormInput label="Dubai area / community" value={booking.location} onChange={(v) => updateBooking({ location: v })} />
        <FormInput label="Full address / building name" value={booking.address} onChange={(v) => updateBooking({ address: v })} />

        {/* Party size auto-set by tier — no manual stepper needed */}

        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Dietary requirements</label>
          <p className="font-body text-sm text-muted-foreground">{booking.dietary.join(", ") || "None"}</p>
        </div>

        <div className="mb-6">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Allergies or special notes</label>
          <textarea value={booking.allergyNotes} onChange={(e) => updateBooking({ allergyNotes: e.target.value })}
            className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Grocery shopping — coming soon */}

        {/* ── TOTAL ── */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>{selectedTier.label} {isDiscovery ? "(First Cook)" : ""} {frequency !== "one-time" ? "/mo" : ""}</span>
            <span>AED {sessionTotal.toLocaleString()}</span>
          </div>
          {booking.groceryAddon && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Grocery shopping service{frequency !== "one-time" ? " (per session)" : ""}</span>
              <span>AED {GROCERY_FEE}</span>
            </div>
          )}
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between items-center">
            <span className="font-body text-base font-semibold text-foreground">Total</span>
            {frequency === "one-time" || frequency === "" ? (
              <span className="font-display text-xl font-bold" style={{ color: "#B57E5D" }}>AED {(sessionTotal + groceryFee).toLocaleString()}</span>
            ) : (
              <div className="text-right">
                <span className="font-display text-xl font-bold" style={{ color: "#B57E5D" }}>AED {sessionTotal.toLocaleString()} /mo</span>
                {groceryFee > 0 && <p className="text-[10px] text-gray-400">+ AED 75 grocery per session</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── T&C ── */}
        <label className="flex items-start gap-2 text-sm text-gray-600 mt-4 mb-4">
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5" />
          <span>I agree to Cooq's <a href="/terms" target="_blank" className="text-[#86A383] underline">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank" className="text-[#86A383] underline">Privacy Policy</a></span>
        </label>

        <button disabled={loading || !agreedToTerms} onClick={handleSubmit}
          className="w-full py-4 rounded-lg font-body font-semibold text-base disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}>
          {loading ? "Saving..." : "Confirm Booking →"}
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
