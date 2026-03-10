import { useBooking } from "@/context/BookingContext";
import cooqLogo from "@/assets/cooq-logo.png";

const Confirmation = () => {
  const { booking } = useBooking();

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center px-6 py-4">
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="flex-1 px-6 pb-6 flex flex-col items-center">
        {/* Animated check */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center my-8">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M10 20L17 27L30 13"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              className="animate-check-draw"
            />
          </svg>
        </div>

        <h1 className="font-display italic text-3xl text-foreground mb-2 text-center">You're booked.</h1>
        <p className="font-body text-muted-foreground text-center mb-8">
          Your cook is confirmed for {booking.bookingDates.map((d) => formatDate(d)).join(" & ")}.
        </p>

        {/* Summary card */}
        <div className="w-full bg-card rounded-xl p-5 mb-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cook</span>
              <span className="font-medium text-foreground">{booking.cookName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Menu</span>
              <span className="font-medium text-foreground">
                {booking.menuSelected}
                {booking.menuSelectedDinner ? ` + ${booking.menuSelectedDinner}` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date(s)</span>
              <span className="font-medium text-foreground">{booking.bookingDates.map((d) => formatDate(d)).join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-foreground">{booking.location}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-display text-lg font-bold text-copper">AED {booking.totalAed}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="w-full text-center">
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-2">
            Complete Your Payment
          </p>
          <p className="font-body text-sm text-muted-foreground mb-4">
            Secure your booking by paying now. Your cook is held for 2 hours.
          </p>
          <a
            href="https://buy.stripe.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base text-center hover:opacity-90 transition-opacity"
          >
            Pay AED {booking.totalAed} →
          </a>
          <p className="font-body text-xs text-muted-foreground mt-3">
            This will open the Stripe payment page. Card, Apple Pay and Google Pay accepted.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="font-body text-sm text-muted-foreground">
            Questions? Email{" "}
            <a href="mailto:hello@cooq.ae" className="text-copper underline">hello@cooq.ae</a>
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            You'll receive a booking confirmation email once payment is complete.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
