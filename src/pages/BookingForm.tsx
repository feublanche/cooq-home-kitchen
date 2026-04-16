import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import cooqLogo from "@/assets/cooq-logo.png";
import StepProgress from "@/components/StepProgress";
import TrustBadges from "@/components/TrustBadges";
import type { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, getDay } from "date-fns";
import { cn } from "@/lib/utils";

const TIER_PRICE: Record<string, number> = { duo: 350, family: 480, large: 550 };
const TIERS = [
  { key: "duo", label: "Cooq Duo", people: "For 1–2 people", duration: "~2 hrs", detail: "1 starter · 1 main · 1 side per person" },
  { key: "family", label: "Cooq Family", people: "For 3–4 people", duration: "~3 hrs", detail: "1 starter · 1 main · 1 side per person" },
  { key: "large", label: "Cooq Large", people: "For 5–6 people", duration: "~4 hrs", detail: "1 starter · 1 main · 1 side per person" },
] as const;
const FREQUENCIES = [
  { key: "once", label: "Try once", sessions: 1, subtitle: "Perfect for a first session", badge: "" },
  { key: "weekly", label: "Once a week", sessions: 4, subtitle: "", badge: "" },
  { key: "twice", label: "Twice a week", sessions: 8, subtitle: "", badge: "Save 5%" },
  { key: "three", label: "3× a week", sessions: 12, subtitle: "", badge: "Save 10%" },
] as const;
const SLOT_OPTIONS = [
  { key: "morning", label: "Morning (8am–12pm)" },
  { key: "afternoon", label: "Afternoon (2pm–6pm)" },
];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const jsDayToIdx = (jsDay: number) => (jsDay + 6) % 7;
const TIER_LABELS: Record<string, string> = { duo: "Cooq Duo", family: "Cooq Family", large: "Cooq Large" };
const FREQ_LABELS: Record<string, string> = { once: "Try once", weekly: "Once a week", twice: "Twice a week", three: "3× a week" };
const TIER_PARTY: Record<string, number> = { duo: 2, family: 4, large: 6 };
const getDiscountRate = (freq: string): number => { if (freq === "twice") return 0.05; if (freq === "three") return 0.10; return 0; };
const getDiscountedSessionPrice = (tier: string, freq: string): number => Math.round((TIER_PRICE[tier] ?? 350) * (1 - getDiscountRate(freq)));
const getTotal = (tier: string, freq: string): number => { const p = getDiscountedSessionPrice(tier, freq); if (freq === "once") return p; return p * (freq === "twice" ? 8 : freq === "three" ? 12 : 4); };
const getSessionCount = (freq: string): number => { if (freq === "once") return 1; if (freq === "twice") return 8; if (freq === "three") return 12; return 4; };

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const { booking, updateBooking } = useBooking();
  const cookId = routerState.cookId;
  const cookInitials = routerState.cookInitials || "TBD";
  const primaryMenuName = routerState.selectedMenuName || "";

  useEffect(() => {
    if (!cookId || !primaryMenuName) { toast({ title: "Please select a cook first.", variant: "destructive" }); navigate("/search", { replace: true }); }
  }, [cookId, primaryMenuName, navigate]);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState("");
  const [frequency, setFrequency] = useState("");
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
  const [savedAddress, setSavedAddress] = useState<{ streetNumber: string; streetName: string; building: string; phone: string } | null>(null);
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cookAvailability, setCookAvailability] = useState<Record<number, string[]>>({});
  const [cookAvailableDays, setCookAvailableDays] = useState<number[]>([]);
  const [cookAvailableLoaded, setCookAvailableLoaded] = useState(false);
  const [noAvailabilitySet, setNoAvailabilitySet] = useState(false);
  const freqRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const minDate = useMemo(() => addDays(new Date(), 2), []);
  const sessionTotal = tier ? getTotal(tier, frequency || "weekly") : 0;
  const baseSessionPrice = tier ? TIER_PRICE[tier] : 0;
  const discountedPrice = tier && frequency ? getDiscountedSessionPrice(tier, frequency) : baseSessionPrice;
  const sessionPrice = discountedPrice || baseSessionPrice;
  const sessionCount = getSessionCount(frequency || "weekly");

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        if (u.user_metadata?.full_name && !booking.customerName) updateBooking({ customerName: u.user_metadata.full_name });
        if (u.email && !booking.email) updateBooking({ email: u.email });
        const { data: lastBooking } = await supabase.from("bookings").select("address, phone").eq("customer_user_id", u.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (lastBooking?.address && lastBooking.address.includes(",")) {
          const parts = lastBooking.address.split(", ");
          if (parts.length >= 3) {
            const saved = { streetNumber: parts[0], streetName: parts[1], building: parts.slice(2).join(", "), phone: (lastBooking.phone || "").replace("+971 ", "").replace(/\s/g, "") };
            setSavedAddress(saved);
            setUsingSavedAddress(true);
            setStreetNumber(saved.streetNumber); setStreetName(saved.streetName); setBuilding(saved.building); setPhone(saved.phone);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!cookId) return;
    let active = true;
    supabase.from("cook_menus").select("id, menu_name").eq("cook_id", cookId).eq("status", "approved").then(({ data }) => { if (active) setAvailableMenus((data || []) as any); });
    return () => { active = false; };
  }, [cookId]);

  useEffect(() => {
    if (!cookId) return;
    let active = true;
    supabase.from("cook_availability").select("day_of_week, available, time_slots").eq("cook_id", cookId).then(({ data }) => {
      if (!active) return;
      if (data && data.length > 0) {
        const activeDays = data.filter(d => d.available !== false);
        setCookAvailableDays(activeDays.map(d => d.day_of_week));
        const slotMap: Record<number, string[]> = {};
        activeDays.forEach(d => { slotMap[d.day_of_week] = (d.time_slots || []) as string[]; });
        setCookAvailability(slotMap);
        setNoAvailabilitySet(false);
      } else { setCookAvailableDays([]); setCookAvailability({}); setNoAvailabilitySet(true); }
      setCookAvailableLoaded(true);
    });
    return () => { active = false; };
  }, [cookId]);

  const isDateAvailable = (date: Date): boolean => { if (!cookAvailableLoaded) return true; return cookAvailableDays.includes(jsDayToIdx(getDay(date))); };
  useEffect(() => { if (tier && freqRef.current) freqRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [tier]);
  useEffect(() => { if (frequency && dateRef.current) dateRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [frequency]);

  const addressComplete = streetNumber.trim() && streetName.trim() && building.trim() && phone.replace(/[^0-9]/g, "").length >= 7;
  const daysComplete = selectedDays.length === numDayPicks;
  const timesComplete = selectedTimes.length === numDayPicks && selectedTimes.every(t => !!t);
  const dateComplete = daysComplete && timesComplete && !!startDate;
  const canSubmit = tier && frequency && dateComplete && addressComplete && agreedToTerms && (numDayPicks <= 1 || secondMenuId);
  const secondaryMenuName = availableMenus.find(m => m.id === secondMenuId)?.menu_name || "";
  const dayLabels = selectedDays.map(d => DAY_NAMES[d]);
  const summaryDaysText = dayLabels.length === 1 ? `Every ${dayLabels[0]}` : dayLabels.length === 2 ? `Every ${dayLabels[0]} + ${dayLabels[1]}` : `Every ${dayLabels[0]}, ${dayLabels[1]} + ${dayLabels[2]}`;
  const getMonthlyLine = (tierKey: string) => { const price = TIER_PRICE[tierKey]; if (!frequency || frequency === "once") return `From AED ${(price * 4).toLocaleString()}/month`; return `AED ${(price * getSessionCount(frequency)).toLocaleString()}/month · ${(FREQ_LABELS[frequency] || "").toLowerCase()}`; };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError("");
    const lastSubmit = sessionStorage.getItem("cooq_last_submit");
    if (lastSubmit && Date.now() - Number(lastSubmit) < 300000) { toast({ title: "Please wait 5 minutes before submitting again.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      sessionStorage.setItem("cooq_last_submit", String(Date.now()));
      const bookingDate = startDate ? format(startDate, "yyyy-MM-dd") : null;
      const sessionNotes = JSON.stringify({ recurring_days: dayLabels, time_slots: selectedTimes.slice(0, numDayPicks), start_date: bookingDate, secondary_session: numDayPicks >= 2 ? { menu_id: secondMenuId || null, menu_name: secondaryMenuName || null } : undefined });
      const fullAddress = [streetNumber, streetName, building].filter(Boolean).join(", ");
      const fullPhone = "+971 " + phone.replace(/[^0-9]/g, "");
      const insertData: any = { customer_name: booking.customerName, email: booking.email, phone: fullPhone, area: booking.location || routerState.cookArea || "", address: fullAddress, cook_id: cookId || "unassigned", cook_name: cookInitials, menu_selected: primaryMenuName, booking_date: bookingDate, frequency: frequency || "weekly", party_size: TIER_PARTY[tier] || 2, dietary: booking.dietary, allergies_notes: dietaryNotes.trim() || "", session_notes: sessionNotes, grocery_addon: false, grocery_fee: 0, tier, session_type: "standard", total_aed: sessionTotal, status: "pending", customer_user_id: user?.id || null, selected_menu_id: routerState.selectedMenuId || null };
      const { data: newBooking, error } = await supabase.from("bookings").insert(insertData).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");
      navigate("/payment", { state: { bookingId: newBooking.id, totalAed: sessionTotal, customerName: newBooking.customer_name, customerEmail: newBooking.email, area: newBooking.area, bookingDate, bookingTime: selectedTimes[0], menuSelected: primaryMenuName, cookName: cookInitials, cookId, selectedMenuName: primaryMenuName, recurringDays: JSON.stringify(dayLabels), frequency } });
    } catch (err: any) {
      console.error("Booking error:", err);
      setSubmitError(err?.message || "Something went wrong. Please try again or contact hello@cooq.ae");
    } finally { setLoading(false); }
  };

  if (!cookId || !primaryMenuName) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>
      <StepProgress current={2} />
      <div className="sticky top-0 z-20 bg-card border-b border-border px-6 py-3">
        <p className="font-body text-sm text-foreground">Booking with <span className="font-semibold">{cookInitials}</span> · <span className="text-copper font-medium">{primaryMenuName}</span></p>
        <TrustBadges />
      </div>

      <div className="flex-1 px-6 pb-32 space-y-8 pt-4">
        {/* SECTION 1: Tier */}
        <div>
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Session size</p>
          <div className="space-y-3">
            {TIERS.map(t => {
              const selected = tier === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setTier(t.key)} className={`w-full text-left rounded-xl p-5 border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-body text-base font-bold text-foreground">{t.label}</p>
                      <p className="font-body text-sm text-muted-foreground mt-0.5">{t.people} · {t.duration}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-copper">AED {TIER_PRICE[t.key]}</p>
                      <p className="font-body text-[11px] text-muted-foreground">per session</p>
                      <p className="font-body text-[10px] text-muted-foreground mt-0.5">{getMonthlyLine(t.key)}</p>
                    </div>
                  </div>
                  {selected && <Check className="w-5 h-5 text-primary mt-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Frequency */}
        {tier && (
          <div ref={freqRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">How often?</p>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map(f => (
                <div key={f.key} className="relative">
                  <button type="button" onClick={() => { setFrequency(f.key); setSelectedDays([]); setSelectedTimes([]); setStartDate(undefined); setSecondMenuId(""); }}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition border ${frequency === f.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"}`}>
                    {f.key === "once" ? "Try once — no commitment" : f.label}
                  </button>
                  {f.badge && <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold leading-none">{f.badge}</span>}
                </div>
              ))}
            </div>
            {frequency === "once" && <p className="font-body text-xs text-muted-foreground mt-2 italic">Perfect for a first session</p>}
          </div>
        )}

        {/* SECTION 3: Days + Times */}
        {tier && frequency && noAvailabilitySet && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-body text-sm text-amber-800">This cook hasn't set their schedule yet — contact cooqdubai@gmail.com</p>
          </div>
        )}
        {tier && frequency && !noAvailabilitySet && (
          <div ref={dateRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Choose your day{numDayPicks > 1 ? "s" : ""} & time{numDayPicks > 1 ? "s" : ""}</p>
            {Array.from({ length: numDayPicks }).map((_, idx) => {
              const selectedDayIdx = selectedDays[idx];
              const slotsForDay = selectedDayIdx !== undefined ? (cookAvailability[selectedDayIdx] || []) : [];
              return (
                <div key={idx} className="space-y-3">
                  {numDayPicks > 1 && <p className="font-body text-sm font-semibold text-foreground">Session {idx + 1}</p>}
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, dayIdx) => {
                      const available = cookAvailableDays.includes(dayIdx);
                      const isSelected = selectedDays[idx] === dayIdx;
                      const takenByOther = selectedDays.includes(dayIdx) && selectedDays[idx] !== dayIdx;
                      return (
                        <button key={name} type="button" disabled={!available || takenByOther}
                          onClick={() => { setSelectedDays(prev => { const n = [...prev]; n[idx] = dayIdx; return n.slice(0, numDayPicks); }); setSelectedTimes(prev => { const n = [...prev]; n[idx] = ""; return n.slice(0, numDayPicks); }); }}
                          className={`px-4 py-2.5 rounded-full text-sm transition border ${isSelected ? "border-primary bg-primary/10 text-primary font-semibold" : !available || takenByOther ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed" : "border-border bg-card text-foreground"}`}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDayIdx !== undefined && (
                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-2">Time slot</p>
                      <div className="flex flex-wrap gap-2">
                        {(slotsForDay.length > 0 ? SLOT_OPTIONS.filter(s => slotsForDay.includes(s.key)) : SLOT_OPTIONS).map(slot => (
                          <button key={slot.key} type="button" onClick={() => { setSelectedTimes(prev => { const n = [...prev]; n[idx] = slot.key; return n.slice(0, numDayPicks); }); }}
                            className={`px-4 py-2 rounded-full text-sm transition border ${selectedTimes[idx] === slot.key ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-foreground"}`}>
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {daysComplete && timesComplete && (
              <div className="space-y-2">
                <p className="font-body text-sm font-semibold text-foreground">Starting from</p>
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date < minDate || !isDateAvailable(date)} className={cn("p-3 pointer-events-auto rounded-xl border border-border bg-card")} />
                {startDate && <p className="font-body text-sm text-primary font-medium mt-1">{frequency === "once" ? `On ${format(startDate, "d MMM yyyy")}` : `${summaryDaysText}, starting ${format(startDate, "d MMM yyyy")}`}</p>}
              </div>
            )}
            {numDayPicks >= 2 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="font-body text-sm font-semibold text-foreground">Second menu (for alternate sessions)</p>
                {availableMenus.length > 0 ? (
                  <select value={secondMenuId} onChange={e => setSecondMenuId(e.target.value)} className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select menu</option>
                    {availableMenus.map(m => <option key={m.id} value={m.id}>{m.menu_name}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder="Describe your preferred menu" value={secondMenuId} onChange={e => setSecondMenuId(e.target.value)} className="w-full p-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Address */}
        {tier && frequency && dateComplete && (
          <div ref={addressRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Your address</p>
            {savedAddress && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground mb-0.5">Saved address</p>
                    <p className="font-body text-xs text-muted-foreground">{savedAddress.streetNumber} {savedAddress.streetName}, {savedAddress.building}</p>
                    <p className="font-body text-xs text-muted-foreground">+971 {savedAddress.phone}</p>
                  </div>
                  <button type="button" onClick={() => {
                    if (usingSavedAddress) { setUsingSavedAddress(false); setStreetNumber(""); setStreetName(""); setBuilding(""); setPhone(""); setTouched({}); }
                    else { setUsingSavedAddress(true); setStreetNumber(savedAddress.streetNumber); setStreetName(savedAddress.streetName); setBuilding(savedAddress.building); setPhone(savedAddress.phone); }
                  }} className="font-body text-xs text-primary underline shrink-0">
                    {usingSavedAddress ? "Use different address" : "Use this address"}
                  </button>
                </div>
              </div>
            )}
            {(!savedAddress || !usingSavedAddress) && (
              <>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Number *</label>
                  <input type="text" value={streetNumber} onChange={e => setStreetNumber(e.target.value)} onBlur={() => setTouched(p => ({ ...p, streetNumber: true }))} className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  {touched.streetNumber && !streetNumber.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1 block">Street Name *</label>
                  <input type="text" value={streetName} onChange={e => setStreetName(e.target.value)} onBlur={() => setTouched(p => ({ ...p, streetName: true }))} className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  {touched.streetName && !streetName.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1 block">Building / Villa / Floor / Apt *</label>
                  <input type="text" value={building} onChange={e => setBuilding(e.target.value)} onBlur={() => setTouched(p => ({ ...p, building: true }))} className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  {touched.building && !building.trim() && <p className="text-xs text-destructive mt-1">Required</p>}
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1 block">Phone number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted font-body text-sm text-muted-foreground">+971</span>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))} onBlur={() => setTouched(p => ({ ...p, phone: true }))} placeholder="50 123 4567" className="flex-1 p-3 rounded-r-lg border border-border bg-card font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  {touched.phone && phone.replace(/[^0-9]/g, "").length < 7 && <p className="text-xs text-destructive mt-1">Required</p>}
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 5: Summary + Confirm */}
        <div className="space-y-4">
          {tier && frequency && (
            <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden p-5 space-y-0">
              <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Booking summary</p>
              <SummaryRow label="Cook" value={cookInitials} /><Divider />
              <SummaryRow label="Menu" value={primaryMenuName} />
              {secondaryMenuName && (<><Divider /><SummaryRow label="2nd Menu" value={secondaryMenuName} /></>)}
              <Divider /><SummaryRow label="Tier" value={TIER_LABELS[tier] || tier} />
              <Divider /><SummaryRow label="Frequency" value={FREQ_LABELS[frequency] || frequency} />
              {selectedDays.length > 0 && (<><Divider /><SummaryRow label="Days" value={summaryDaysText} /></>)}
              {startDate && (<><Divider /><SummaryRow label="Starting" value={format(startDate, "EEE, d MMM yyyy")} /></>)}
              <Divider />
              <div className="flex justify-between items-center py-3">
                <span className="font-body text-sm text-muted-foreground">Per session</span>
                <div className="text-right">
                  {getDiscountRate(frequency) > 0 ? (<><span className="font-body text-sm text-muted-foreground line-through mr-2">AED {baseSessionPrice}</span><span className="font-display text-base font-bold text-primary">AED {sessionPrice}</span></>) : (<span className="font-display text-base font-bold text-copper">AED {sessionPrice}</span>)}
                </div>
              </div>
              {getDiscountRate(frequency) > 0 && <p className="font-body text-xs text-primary font-semibold pb-1">{Math.round(getDiscountRate(frequency) * 100)}% recurring discount applied</p>}
              {frequency !== "once" && (<><Divider /><div className="flex justify-between items-center py-3"><span className="font-body text-sm text-muted-foreground">Monthly total</span><div className="text-right">{getDiscountRate(frequency) > 0 && <span className="font-body text-sm text-muted-foreground line-through mr-2">AED {(baseSessionPrice * sessionCount).toLocaleString()}</span>}<span className="font-display text-xl font-bold text-copper">AED {sessionTotal.toLocaleString()}</span><span className="font-body text-xs text-muted-foreground ml-1">({sessionCount} sessions)</span></div></div></>)}
            </div>
          )}
          <div>
            <label className="font-body text-sm font-medium text-foreground mb-1 block">Dietary notes (optional)</label>
            <textarea value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)} placeholder="Any allergies, preferences, or special requests..." className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5" />
            <span>I agree to Cooq's <a href="/terms" target="_blank" className="text-primary underline">Terms & Conditions</a> and <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a></span>
          </label>
          {tier && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
              <p className="font-body text-sm font-semibold text-foreground">{TIER_LABELS[tier]} · {getDiscountRate(frequency) > 0 ? (<><span className="line-through text-muted-foreground">AED {baseSessionPrice}</span> <span className="text-primary">AED {sessionPrice}</span></>) : <>AED {sessionPrice}</>}/session</p>
              {getDiscountRate(frequency) > 0 && <p className="font-body text-xs text-primary font-semibold">{Math.round(getDiscountRate(frequency) * 100)}% recurring discount</p>}
              {frequency && <p className="font-body text-xs text-muted-foreground">{FREQ_LABELS[frequency]} · {frequency === "once" ? "1 session" : `~${sessionCount} sessions/month`}</p>}
              {frequency && frequency !== "once" && <p className="font-body text-xs text-copper font-medium">Est. monthly: AED {sessionTotal.toLocaleString()}</p>}
              <p className="font-body text-xs text-muted-foreground">{cookInitials} · {primaryMenuName}</p>
            </div>
          )}
          <p className="font-body text-xs text-muted-foreground leading-relaxed">🔒 Secure payment · Cooq Certified cook · Free cancellation or reschedule if requested 48hrs+ before session</p>
          {submitError && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3"><p className="font-body text-sm text-destructive">{submitError}</p></div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-30">
        <div className="max-w-[430px] mx-auto">
          <button disabled={loading || !canSubmit} onClick={handleSubmit} className="w-full py-4 rounded-xl font-body font-semibold text-base disabled:opacity-40 transition-opacity text-accent-foreground bg-copper">
            {loading ? "Processing..." : frequency === "once" ? `Confirm & Pay · AED ${sessionPrice} · single session` : `Confirm & Pay · AED ${sessionPrice}/session`}
          </button>
          {frequency && frequency !== "once" && tier && <p className="font-body text-xs text-muted-foreground text-center mt-2">AED {sessionTotal.toLocaleString()}/month · {sessionCount} sessions</p>}
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
