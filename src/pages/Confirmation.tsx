import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, totalPaid, bookingDate, area, selectedMenuName } = (location.state as any) || {};

  const [cookData, setCookData] = useState<any>(null);
  const [bookingTotal, setBookingTotal] = useState<number>(totalPaid || 0);

  useEffect(() => {
    if (!bookingId) return;
    const fetchCook = async () => {
      const { data: booking } = await supabase
        .from("bookings")
        .select("cook_id, cook_name, total_aed")
        .eq("id", bookingId)
        .single();
      if (!booking) return;
      setBookingTotal(booking.total_aed || totalPaid || 0);

      const { data: cook } = await supabase
        .from("cooks")
        .select("name, photo_url, cuisine")
        .eq("id", booking.cook_id)
        .single();
      setCookData({ ...cook, cook_name: booking.cook_name });
    };
    fetchCook();
  }, [bookingId]);

  const cook = cookData;
  const displayName = cook?.name || cook?.cook_name || "Your Cook";
  const initial = displayName.charAt(0);

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col">
      {/* Slate top section */}
      <div className="bg-[#2D312E] rounded-b-3xl pb-8 px-4 pt-8 flex flex-col items-center">
        <CheckCircle2 className="w-10 h-10 text-[#86A383] mx-auto" />
        <h1 className="font-display italic text-[28px] text-[#F9F7F2] text-center mt-3">You're all set.</h1>
        <p className="text-[13px] text-[#86A383] text-center mt-1">Your session is confirmed.</p>
      </div>

      {/* Cook reveal card */}
      <div className="bg-white rounded-2xl mx-4 -mt-4 p-6 shadow-lg flex flex-col items-center relative z-10">
        {cook?.photo_url ? (
          <img
            src={cook.photo_url}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="w-24 h-24 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: "#B57E5D" }}>
            <span className="font-display text-3xl text-white">{initial}</span>
          </div>
        )}
        <h2 className="font-display text-[20px] text-[#2D312E] text-center">{displayName}</h2>
        <p className="text-[11px] text-[#B57E5D] uppercase tracking-wider text-center mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>Your Cooq</p>
        <p className="text-[11px] text-[#86A383] text-center mt-1">✓ Health Card Verified</p>
        <p className="text-[12px] text-gray-400 italic text-center mt-2">Your cook's full details are now revealed</p>
      </div>

      {/* Booking details card */}
      <div className="bg-white rounded-xl mx-4 mt-4 p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          {selectedMenuName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Menu</span>
              <span className="font-medium text-[#2D312E]">{selectedMenuName}</span>
            </div>
          )}
          {bookingDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-[#2D312E]">{bookingDate}</span>
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
            <span className="font-bold text-[#B57E5D]">AED {bookingTotal}</span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#86A383]/10 border border-[#86A383]/20 rounded-xl mx-4 mt-4 p-4">
        <p className="text-[#86A383] text-sm">We'll confirm your cook's arrival time by email within 2 hours.</p>
      </div>

      {/* Buttons */}
      <div className="mx-4 mt-6">
        <button
          onClick={() => navigate("/my-bookings")}
          className="bg-[#B57E5D] text-white rounded-xl py-4 w-full font-semibold text-sm"
        >
          View My Bookings →
        </button>
      </div>
      <button
        onClick={() => navigate("/")}
        className="text-center text-gray-500 text-sm mt-3"
      >
        Back to Home
      </button>
      <a href="mailto:hello@cooq.ae" className="text-center text-gray-400 text-xs mt-2 mb-8">
        Questions? hello@cooq.ae
      </a>
    </div>
  );
};

export default Confirmation;
