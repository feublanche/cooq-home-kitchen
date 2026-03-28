import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const { bookingId, cookId, totalPaid, bookingDate, bookingTime, area, selectedMenuName, secondaryBookingDate, secondaryMenuName } = state;

  const [cookData, setCookData] = useState<any>(null);
  const [fallbackTotal, setFallbackTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if ((!totalPaid || totalPaid === 0) && bookingId) {
        const { data: b } = await supabase.from("bookings").select("total_aed").eq("id", bookingId).single();
        if (b) setFallbackTotal(b.total_aed || 0);
      }
      if (cookId) {
        const { data: rows } = await supabase.rpc("get_public_cook_by_id", { cook_uuid: cookId });
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
  }, [bookingId, cookId, totalPaid]);

  const displayTotal = totalPaid || fallbackTotal;
  const displayName = cookData?.name || "Your Cook";
  const initial = displayName.charAt(0);

  const formattedDate = bookingDate
    ? new Date(bookingDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-bold text-accent">AED {displayTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl mx-4 mt-4 p-4">
        <p className="text-primary text-sm leading-relaxed">
          Your booking is confirmed. A confirmation email has been sent to your inbox with all the details.
        </p>
        {state.recurringDays && (() => { try { const d = JSON.parse(state.recurringDays); return d.length > 1 ? (
          <p className="text-primary text-sm mt-2">
            Your {state.frequency || "recurring"} sessions: {d.join(" + ")}
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
