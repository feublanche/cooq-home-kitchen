import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";

const steps = ["Preferences", "Match", "Profile", "Details", "Confirm"];

// IMPORTANT: Defined OUTSIDE the component so React doesn't remount on every render
const FormInput = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) => (
  <div className="mb-4">
    <label className="font-body text-sm font-medium text-foreground mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
    {error && <p className="font-body text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const BookingForm = () => {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groceryFee = booking.groceryAddon ? Math.round(booking.menuPrice * 0.1) : 0;
  const addOnFee = booking.addOns.length * 25; // AED 25 per add-on category
  const total = booking.menuPrice + groceryFee + addOnFee;

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
    setLoading(true);
    try {
      const { data: newBooking, error } = await supabase.from("bookings").insert({
        customer_name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        area: booking.location,
        address: booking.address,
        cook_id: booking.cookId,
        cook_name: booking.cookName,
        menu_selected: booking.menuSelected,
        booking_date: booking.bookingDates.join(", "),
        frequency: booking.frequency,
        party_size: booking.partySize,
        dietary: booking.dietary,
        allergies_notes: booking.allergyNotes,
        grocery_addon: booking.groceryAddon,
        total_aed: total,
        status: "pending",
      }).select().single();
      if (error || !newBooking) throw error || new Error("Booking creation failed");
      updateBooking({ totalAed: total });
      navigate("/payment", {
        state: {
          bookingId: newBooking.id,
          totalAed: newBooking.total_aed || 350,
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
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
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
            <span key={s} className={`font-body text-[10px] ${i <= 3 ? "text-primary" : "text-muted-foreground"}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 flex-1">
        {/* Order summary */}
        <div className="bg-primary/10 rounded-xl p-4 mb-6">
          <p className="font-body text-sm font-semibold text-foreground">
            {booking.cookName} · {booking.cookCuisine}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            {booking.menuSelected}
            {booking.menuSelectedDinner ? ` + ${booking.menuSelectedDinner} (Dinner)` : ""}
            {" · "}
            {booking.bookingDates.map((d) => formatDate(d)).join(", ")}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            {booking.frequency} · {booking.selectedDays.join(", ")}
          </p>
          {booking.addOns.length > 0 && (
            <p className="font-body text-xs text-muted-foreground">
              Add-ons: {booking.addOns.join(", ")}
            </p>
          )}
          {booking.swappedDishes.length > 0 && (
            <p className="font-body text-xs text-primary">
              {booking.swappedDishes.length} dish swap{booking.swappedDishes.length > 1 ? "s" : ""} applied
            </p>
          )}
          <p className="font-body text-base font-semibold text-copper mt-1">AED {booking.menuPrice}</p>
        </div>

        {/* Form */}
        <FormInput
          label="Full name *"
          value={booking.customerName}
          onChange={(v) => updateBooking({ customerName: v })}
          error={errors.customerName}
        />
        <FormInput
          label="Email address *"
          type="email"
          value={booking.email}
          onChange={(v) => updateBooking({ email: v })}
          error={errors.email}
        />
        <FormInput
          label="Phone number *"
          value={booking.phone}
          onChange={(v) => updateBooking({ phone: v })}
          placeholder="+971"
          error={errors.phone}
        />
        <FormInput
          label="Dubai area / community"
          value={booking.location}
          onChange={(v) => updateBooking({ location: v })}
        />
        <FormInput
          label="Full address / building name"
          value={booking.address}
          onChange={(v) => updateBooking({ address: v })}
        />

        <div className="mb-4">
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Party size</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateBooking({ partySize: Math.max(1, booking.partySize - 1) })}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center font-body font-bold"
            >
              −
            </button>
            <span className="font-body text-lg font-semibold">{booking.partySize}</span>
            <button
              onClick={() => updateBooking({ partySize: Math.min(20, booking.partySize + 1) })}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center font-body font-bold"
            >
              +
            </button>
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

        {/* Grocery toggle */}
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
            <p className="font-body text-xs text-muted-foreground">+10% = AED {Math.round(booking.menuPrice * 0.1)}</p>
          </div>
          <button
            onClick={() => updateBooking({ groceryAddon: !booking.groceryAddon })}
            className={`w-12 h-7 rounded-full transition-colors relative ${booking.groceryAddon ? "bg-primary" : "bg-border"}`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-card absolute top-1 transition-transform ${
                booking.groceryAddon ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-6">
          Your Cooq handles the shopping. They'll submit the grocery receipt for your reimbursement.
        </p>

        {/* Total */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>Menu base</span>
            <span>AED {booking.menuPrice}</span>
          </div>
          {booking.groceryAddon && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Grocery concierge</span>
              <span>AED {groceryFee}</span>
            </div>
          )}
          {addOnFee > 0 && (
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Add-ons ({booking.addOns.length})</span>
              <span>AED {addOnFee}</span>
            </div>
          )}
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between items-center">
            <span className="font-body text-base font-semibold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-copper">AED {total}</span>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          {loading ? "Saving..." : "Confirm Booking →"}
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
