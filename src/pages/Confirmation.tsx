import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const { bookingId, cookId, totalPaid, bookingDate, bookingTime, area, selectedMenuName } = state;

  const [cookData, setCookData] = useState<any>(null);
  const [fallbackTotal, setFallbackTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      // Fallback total from DB if missing
      if ((!totalPaid || totalPaid === 0) && bookingId) {
        const { data: b } = await supabase.from("bookings").select("total_aed").eq("id", bookingId).single();
        if (b) setFallbackTotal(b.total_aed || 0);
      }
      // Load cook data
      if (cookId) {
        const { data: cook } = await supabase.from("cooks").select("name, photo_url, cuisine").eq("id", cookId).single();
        if (cook) setCookData(cook);
      } else if (bookingId) {
        const { data: booking } = await supabase.from("bookings").select("cook_id, cook_name").eq("id", bookingId).single();
        if (booking?.cook_id) {
          const { data: cook } = await supabase.from("cooks").select("name, photo_url, cuisine").eq("id", booking.cook_id).single();
          if (cook) setCookData(cook);
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
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col">
      <div className="bg-[#2D312E] rounded-b-3xl pb-8 px-4 pt-8 flex flex-col items-center">
        <CheckCircle2 className="w-10 h-10 text-[#86A383] mx-auto" />
        <h1 className="font-display italic text-[28px] text-[#F9F7F2] text-center mt-3">You're all set.</h1>
        <p className="text-[13px] text-[#86A383] text-center mt-1">Your session is confirmed.</p>
      </div>

      {/* Cook reveal card */}
      <div className="bg-white rounded-2xl mx-4 -mt-4 p-6 shadow-lg flex flex-col items-center relative z-10">
        {cookData?.photo_url ? (
          <img src={cookData.photo_url} alt={displayName} className="w-[72px] h-[72px] rounded-full object-cover mb-3" style={{ filter: "none" }} />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: "#B57E5D" }}>
            <span className="font-display text-2xl text-white">{cookData ? initial : "?"}</span>
          </div>
        )}
        <h2 className="font-display text-[20px] text-[#2D312E] text-center">{cookData ? displayName : "Your cook will be confirmed shortly"}</h2>
        <p className="text-[11px] text-[#B57E5D] uppercase tracking-wider text-center mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>Your Cooq</p>
        {cookData?.cuisine && (
          <p className="text-[12px] text-gray-400 text-center mt-1">{cookData.cuisine.join(" · ")}</p>
        )}
        <p className="text-[11px] text-[#86A383] text-center mt-1">✓ Health Card Verified</p>
        <p className="text-[12px] text-gray-400 italic text-center mt-2">Your cook's full details are now revealed</p>
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-xl mx-4 mt-4 p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          {selectedMenuName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Menu</span>
              <span className="font-medium text-[#2D312E]">{selectedMenuName}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-[#2D312E]">{formattedDate}</span>
            </div>
          )}
          {bookingTime && (
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-[#2D312E]">{bookingTime}</span>
            </div>
          )}
          {area && (
            <div className="flex justify-between">
              <span className="text-gray-500">Area</span>
              <span className="font-medium text-[#2D312E]">{area}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Total Paid</span>
            <span className="font-bold text-[#B57E5D]">AED {displayTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#86A383]/10 border border-[#86A383]/20 rounded-xl mx-4 mt-4 p-4">
        <p className="text-[#86A383] text-sm leading-relaxed">
          We'll send you a WhatsApp message and email the day before your session to confirm your cook's arrival time. Your cook will arrive within ±30 minutes of the agreed time slot.
        </p>
      </div>

      {/* Buttons */}
      <div className="mx-4 mt-6">
        <button onClick={() => navigate("/my-bookings")} className="bg-[#B57E5D] text-white rounded-xl py-4 w-full font-semibold text-sm">
          View My Bookings →
        </button>
      </div>
      <button onClick={() => navigate("/")} className="text-center text-gray-500 text-sm mt-3">Back to Home</button>
      <a href="mailto:hello@cooq.ae" className="text-center text-gray-400 text-xs mt-2 mb-8 block">Questions? hello@cooq.ae</a>
    </div>
  );
};

export default Confirmation;
