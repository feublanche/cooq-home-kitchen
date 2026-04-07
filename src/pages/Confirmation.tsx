import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import StepProgress from "@/components/StepProgress";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state as any) || {};

  // Support both navigation state and URL params (Stripe 3DS redirect)
  const bookingIdFromUrl = searchParams.get("booking_id");
  const bookingId = state.bookingId || bookingIdFromUrl;

  const [cookData, setCookData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(!state.bookingId && !!bookingIdFromUrl);

  useEffect(() => {
    const load = async () => {
      // If we arrived via URL param (Stripe redirect), fetch booking from DB
      if (!state.bookingId && bookingIdFromUrl) {
        const { data: b } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingIdFromUrl)
          .single();
        if (b) setBookingData(b);
        setLoading(false);
      }

      const cid = state.cookId || bookingData?.cook_id;
      if (cid) {
        const { data: rows } = await supabase.rpc("get_public_cook_by_id", { cook_uuid: cid });
        if (rows?.[0]) setCookData(rows[0]);
      } else if (bookingId) {
        const { data: booking } = await supabase.from("bookings").select("cook_id, cook_name").eq("id", bookingId).single();
        if (booking?.cook_id) {
          const { data: rows } = await supabase.rpc("get_public_cook_by_id", { cook_uuid: booking.cook_id });
          if (rows?.[0]) setCookData(rows[0]);
        }
      }
    };
    load();
  }, [bookingId, state.cookId, bookingData?.cook_id, bookingIdFromUrl, state.bookingId]);

  // Merge state and DB data
  const totalPaid = state.totalPaid || bookingData?.total_aed || 0;
  const selectedMenuName = state.selectedMenuName || bookingData?.menu_selected;
  const bookingDate = state.bookingDate || bookingData?.booking_date;
  const bookingTime = state.bookingTime;
  const area = state.area || bookingData?.area;
  const frequency = state.frequency || bookingData?.frequency;
  const tier = state.tier || bookingData?.tier;
  const cookInitials = state.cookName || bookingData?.cook_name || "";
  const secondaryBookingDate = state.secondaryBookingDate;
  const secondaryMenuName = state.secondaryMenuName;

  const displayName = cookData?.name || cookInitials || "Your Cook";
  const initial = displayName.charAt(0);

  const formattedDate = bookingDate
    ? new Date(bookingDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StepProgress current={4} />
      <div className="bg-foreground rounded-b-3xl pb-8 px-4 pt-8 flex flex-col items-center">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
        <h1 className="font-display italic text-[28px] text-primary-foreground text-center mt-3">You're all set.</h1>
        <p className="text-[13px] text-primary text-center mt-1">Your session is confirmed.</p>
      </div>

      {/* Cook reveal card */}
      <div className="bg-card rounded-2xl mx-4 -mt-4 p-6 shadow-lg flex flex-col items-center relative z-10">
        {cookData?.photo_url ? (
          <img src={cookData.photo_url} alt={displayName} className="w-[72px] h-[72px] rounded-full object-cover mb-3" style={{ filter: "none" }} />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full mb-3 flex items-center justify-center bg-copper">
            <span className="font-display text-2xl text-accent-foreground">{cookData ? initial : "?"}</span>
          </div>
        )}
        <h2 className="font-display text-[20px] text-foreground text-center">{cookData ? displayName : "Your cook will be confirmed shortly"}</h2>
        <p className="text-[11px] text-copper uppercase tracking-wider text-center mt-1 font-body">Your Cooq</p>
        {cookData?.cuisine && (
          <p className="text-[12px] text-muted-foreground text-center mt-1">{cookData.cuisine.join(" · ")}</p>
        )}
        <p className="text-[11px] text-primary text-center mt-1">✓ Health Card Verified</p>
        <p className="text-[12px] text-muted-foreground italic text-center mt-2">Your cook's full details are now revealed</p>
      </div>

      {/* Booking details */}
      <div className="bg-card rounded-xl mx-4 mt-4 p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          {selectedMenuName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Menu</span>
              <span className="font-medium text-foreground">{selectedMenuName}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{formattedDate}</span>
            </div>
          )}
          {secondaryBookingDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">2nd Date</span>
              <span className="font-medium text-foreground">
                {new Date(secondaryBookingDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
          {secondaryMenuName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">2nd Menu</span>
              <span className="font-medium text-foreground">{secondaryMenuName}</span>
            </div>
          )}
          {bookingTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground">{bookingTime}</span>
            </div>
          )}
          {area && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Area</span>
              <span className="font-medium text-foreground">{area}</span>
            </div>
          )}
          {frequency && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-medium text-foreground">
                {frequency === "once" ? "Try once" : frequency === "weekly" ? "Once a week" : frequency === "twice" ? "Twice a week" : frequency === "three" ? "3× a week" : frequency}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-bold text-accent">AED {totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Session summary card */}
      <div className="bg-card rounded-xl mx-4 mt-4 p-5 shadow-sm border border-border">
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Session Summary</p>
        <div className="space-y-1.5 text-sm">
          <p className="font-body text-foreground font-medium">{displayName}</p>
          {selectedMenuName && <p className="font-body text-muted-foreground">{selectedMenuName}</p>}
          {tier && <p className="font-body text-muted-foreground">{tier === "duo" ? "Cooq Duo" : tier === "family" ? "Cooq Family" : tier === "large" ? "Cooq Large" : tier}</p>}
          {frequency && <p className="font-body text-muted-foreground">{frequency === "once" ? "Try once" : frequency === "weekly" ? "Once a week" : frequency === "twice" ? "Twice a week" : frequency === "three" ? "3× a week" : frequency}</p>}
        </div>
        <p className="font-body text-[11px] text-primary mt-3">Full refund if cancelled 48hrs+ before your session.</p>
      </div>

      {/* Info box */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl mx-4 mt-4 p-4">
        <p className="text-primary text-sm leading-relaxed">
          Your booking is confirmed. A confirmation email has been sent to your inbox with all the details.
        </p>
        {state.recurringDays && (() => { try { const d = JSON.parse(state.recurringDays); return d.length > 1 ? (
          <p className="text-primary text-sm mt-2">
            Your {frequency || "recurring"} sessions: {d.join(" + ")}
          </p>
        ) : null; } catch { return null; } })()}
      </div>

      {/* Buttons */}
      <div className="mx-4 mt-6">
        <button onClick={() => navigate("/bookings")} className="bg-copper text-accent-foreground rounded-xl py-4 w-full font-semibold text-sm">
          View my bookings →
        </button>
      </div>
      <button onClick={() => navigate("/")} className="text-center text-muted-foreground text-sm mt-3">Back to Home</button>
      <a href="mailto:hello@cooq.ae" className="text-center text-muted-foreground text-xs mt-2 mb-8 block">Questions? hello@cooq.ae</a>
    </div>
  );
};

export default Confirmation;
