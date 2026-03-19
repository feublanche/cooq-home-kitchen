import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Info, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import type { User } from "@supabase/supabase-js";

const steps = ["Preferences", "Match", "Profile", "Details", "Confirm"];

const PRICING = {
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

const getTotal = (tier: string, frequency: string, isFirstCook: boolean): number => {
  const key = (isFirstCook && tier === 'duo' && frequency === 'one-time') ? 'first-cook' : frequency;
  return PRICING[key as keyof typeof PRICING]?.[tier as keyof typeof PRICING['one-time']] ?? 350;
};

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
  const [tier, setTierRaw] = useState<string>(routerState.tier || "duo");

  const setTier = (newTier: string) => {
    setTierRaw(newTier);
    const limits = TIER_LIMITS[newTier];
    if (limits) {
      updateBooking({ partySize: limits.min });
    }
    // Uncheck first session if not duo
    if (newTier !== "duo") {
      setIsFirstSession(false);
    }
  };
  const [frequency, setFrequency] = useState<string>("one-time");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        if (u.user_metadata?.full_name && !booking.customerName) {
          updateBooking({ customerName: u.user_metadata.full_name });
        }
        if (u.email && !booking.email) {
          updateBooking({ email: u.email });
        }
      }
    });
  }, []);

  const selectedTier = TIERS.find((t) => t.key === tier)!;
  const isDiscovery = isFirstSession && tier === "duo";

  const sessionPrice = getTotal(tier, frequency, isFirstSession);
  const groceryFee = booking.groceryAddon ? GROCERY_FEE : 0;
  const total = sessionPrice + groceryFee;

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

    // Security: rate limit
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) {
      toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" });
      return;
    }

    // Security: validate amount
    if (!total || total < 299 || total > 6000) {
      toast({ title: "Invalid booking amount.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Security: sanitise text
      const sanitisedAllergyNotes = booking.allergyNotes?.replace(/<[^>]*>/g, "").trim() || "";

      sessionStorage.setItem("cooq_last_submit", String(Date.now()));

      const sessionType = isDiscovery ? "discovery" : "standard";
      const { data: newBooking, error } = await supabase.from("bookings").insert({
        customer_name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        area: booking.location,
        address: booking.address,
        cook_id: routerState.cookId || booking.cookId,
        cook_name: booking.cookName,
        menu_selected: routerState.selectedMenuName || booking.menuSelected,
        booking_date: booking.bookingDates.join(", "),
        frequency,
        party_size: booking.partySize,
        dietary: booking.dietary,
        allergies_notes: sanitisedAllergyNotes,
        grocery_addon: booking.groceryAddon,
        grocery_fee: booking.groceryAddon ? GROCERY_FEE : 0,
        tier,
        session_type: sessionType,
        total_aed: total,
        status: "pending",
        customer_user_id: user?.id || null,
        selected_menu_id: routerState.selectedMenuId || null,
      }).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");
      updateBooking({ totalAed: total });
      navigate("/payment", {
        state: {
          bookingId: newBooking.id,
          totalAed: newBooking.total_aed || total,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.email,
          area: newBooking.area,
          bookingDate: newBooking.booking_date,
          menuSelected: newBooking.menu_selected,
          cookName: newBooking.cook_name || null,
        },
      });
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      {/* Progress */}
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
        {/* ── BOOKING SUMMARY CARD ── */}
        {routerState.cookInitials && (
          <div className="bg-[#86A383]/10 rounded-xl p-4 mb-4">
            <p className="font-body text-[14px] font-bold text-foreground">Booking with: {routerState.cookInitials}</p>
            {routerState.selectedMenuName && <p className="font-body text-[12px] text-gray-500 italic">Menu: {routerState.selectedMenuName}</p>}
            {routerState.cookArea && <p className="font-body text-[12px] text-gray-500">Area: {routerState.cookArea}</p>}
          </div>
        )}

        {/* ── TIER SELECTION ── */}
        <p className="font-body text-sm font-bold text-foreground mb-3">Choose your session tier</p>
        <div className="grid grid-cols-1 gap-3 mb-4">
          {TIERS.map((t) => {
            const selected = tier === t.key;
            const showDiscovery = isFirstSession && t.key === "duo";
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTier(t.key)}
                className={`text-left rounded-xl p-4 border-2 transition cursor-pointer ${
                  selected ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body text-sm font-bold text-foreground">{t.label} <span className="font-normal text-muted-foreground">· {t.people}</span></p>
                    <p className="font-body text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                  <div className="text-right">
                    {showDiscovery ? (
                      <>
                        <p className="font-body text-sm font-bold" style={{ color: "#B57E5D" }}>AED 299</p>
                        <span className="font-body text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(181,126,93,0.15)", color: "#B57E5D" }}>First Cook trial</span>
                      </>
                    ) : (
                      <p className="font-body text-sm font-bold text-foreground">AED {t.price}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* First session checkbox */}
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={isFirstSession}
            onChange={(e) => setIsFirstSession(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary"
          />
          <span className="font-body text-xs text-muted-foreground">This is my first Cooq session</span>
        </label>

        {/* ── FREQUENCY ── */}
        <p className="font-body text-sm font-bold text-foreground mb-3">How often?</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {FREQUENCIES.map((f) => {
            const selected = frequency === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFrequency(f.key)}
                className={`font-body text-xs px-4 py-2 rounded-full border transition ${
                  selected ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

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
            <p className="font-body text-[11px] text-muted-foreground mt-1">
              {SESSIONS[frequency]} sessions per month · 15% off
            </p>
          </div>
        ) : (
          <p className="font-body text-xs text-muted-foreground mb-4">
            AED {sessionPrice} per session
          </p>
        )}
        <div className="mb-6" />

        {/* ── ORDER SUMMARY ── */}
        <div className="bg-primary/10 rounded-xl p-4 mb-6">
          <p className="font-body text-sm font-semibold text-foreground">
            {selectedTier.label} · {booking.cookName || "We'll match you"}
          </p>
          <p className="font-body text-xs text-muted-foreground">
            {isDiscovery ? "First Cook trial" : "Standard session"} · {FREQUENCIES.find((f) => f.key === frequency)?.label}
          </p>
          {booking.menuSelected && (
            <p className="font-body text-xs text-muted-foreground mt-1">{booking.menuSelected}</p>
          )}
          {booking.bookingDates.length > 0 && (
            <p className="font-body text-xs text-muted-foreground">{booking.bookingDates.map(formatDate).join(", ")}</p>
          )}
          <div className="mt-2 pt-2 border-t border-primary/20">
            <div className="flex justify-between font-body text-xs text-muted-foreground">
              <span>Session{frequency !== "one-time" ? ` (${SESSIONS[frequency]}×/mo)` : ""}</span><span>AED {sessionPrice}</span>
            </div>
            {booking.groceryAddon && (
              <div className="flex justify-between font-body text-xs text-muted-foreground">
                <span>Grocery shopping</span><span>AED {GROCERY_FEE}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-sm font-bold mt-1" style={{ color: "#B57E5D" }}>
              <span>Total</span><span>AED {total}</span>
            </div>
          </div>
        </div>

        {/* ── FORM FIELDS ── */}
        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Full name *</label>
          <div className="relative">
            <input
              type="text" value={booking.customerName} readOnly={!!user?.user_metadata?.full_name}
              onChange={(e) => updateBooking({ customerName: e.target.value })}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
            />
            {user?.user_metadata?.full_name && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          {errors.customerName && <p className="font-body text-xs text-destructive mt-1">{errors.customerName}</p>}
        </div>
        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Email address *</label>
          <div className="relative">
            <input
              type="email" value={booking.email} readOnly={!!user?.email}
              onChange={(e) => updateBooking({ email: e.target.value })}
              className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
            />
            {user?.email && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          {errors.email && <p className="font-body text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <FormInput label="Phone number *" value={booking.phone} onChange={(v) => updateBooking({ phone: v })} placeholder="+971" error={errors.phone} />
        <FormInput label="Dubai area / community" value={booking.location} onChange={(v) => updateBooking({ location: v })} />
        <FormInput label="Full address / building name" value={booking.address} onChange={(v) => updateBooking({ address: v })} />

        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Party size</label>
          <div className="flex items-center gap-3">
            <button onClick={() => updateBooking({ partySize: Math.max(1, booking.partySize - 1) })} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center font-body font-bold">−</button>
            <span className="font-body text-lg font-semibold">{booking.partySize}</span>
            <button onClick={() => updateBooking({ partySize: Math.min(20, booking.partySize + 1) })} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center font-body font-bold">+</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Dietary requirements</label>
          <p className="font-body text-sm text-muted-foreground">{booking.dietary.join(", ") || "None"}</p>
        </div>

        <div className="mb-6">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Allergies or special notes</label>
          <textarea
            value={booking.allergyNotes}
            onChange={(e) => updateBooking({ allergyNotes: e.target.value })}
            className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* ── GROCERY TOGGLE ── */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border mb-2" style={{ boxShadow: "var(--shadow-card)" }}>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-body text-sm font-semibold text-foreground">Add grocery shopping</p>
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-lg bg-foreground text-background font-body text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20 shadow-lg">
                  Your Cooq will purchase the groceries and submit the receipt to you for reimbursement. This fee covers the shopping service only.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1" />
                </div>
              </div>
            </div>
            <p className="font-body text-xs text-muted-foreground">Grocery shopping service: AED {GROCERY_FEE}</p>
          </div>
          <button
            onClick={() => updateBooking({ groceryAddon: !booking.groceryAddon })}
            className={`w-12 h-7 rounded-full transition-colors relative ${booking.groceryAddon ? "bg-primary" : "bg-border"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-card absolute top-1 transition-transform ${booking.groceryAddon ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-6">
          Your Cooq handles the shopping. They'll submit the grocery receipt for your reimbursement.
        </p>

        {/* ── TOTAL ── */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>{selectedTier.label} {isDiscovery ? "(First Cook)" : ""} {frequency !== "one-time" ? "/mo" : ""}</span>
            <span>AED {sessionPrice}</span>
          </div>
          {booking.groceryAddon && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Grocery shopping service</span>
              <span>AED {GROCERY_FEE}</span>
            </div>
          )}
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between items-center">
            <span className="font-body text-base font-semibold text-foreground">Total</span>
            <span className="font-display text-xl font-bold" style={{ color: "#B57E5D" }}>AED {total}</span>
          </div>
        </div>

        {/* ── T&C ── */}
        <label className="flex items-start gap-2 text-sm text-gray-600 mt-4 mb-4">
          <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5" />
          <span>I agree to Cooq's <a href="/terms" target="_blank" className="text-[#86A383] underline">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank" className="text-[#86A383] underline">Privacy Policy</a></span>
        </label>

        <button
          disabled={loading || !agreedToTerms}
          onClick={handleSubmit}
          className="w-full py-4 rounded-lg font-body font-semibold text-base disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#B57E5D", color: "#F9F7F2" }}
        >
          {loading ? "Saving..." : "Confirm Booking →"}
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
