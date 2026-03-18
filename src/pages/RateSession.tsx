import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Star, CheckCircle2, ArrowLeft } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import { format } from "date-fns";

const starLabels: Record<number, string> = {
  1: "Poor",
  2: "Below expectations",
  3: "Good",
  4: "Very good",
  5: "Excellent ✨",
};

export default function RateSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setLoading(false);
    };
    fetch();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (selectedStar === 0 || !bookingId) return;
    setSubmitting(true);
    await supabase
      .from("bookings")
      .update({ rating: selectedStar, rating_note: note || null, rated_at: new Date().toISOString() })
      .eq("id", bookingId);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9F7F2" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  if (!booking || booking.status !== "completed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: "#F9F7F2" }}>
        <p className="font-body text-sm text-slate-600 text-center">This session hasn't been completed yet.</p>
        <button onClick={() => navigate(-1)} className="font-body text-sm underline" style={{ color: "#86A383" }}>
          <ArrowLeft className="w-4 h-4 inline mr-1" />Go back
        </button>
      </div>
    );
  }

  if (booking.rating != null && !submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: "#F9F7F2" }}>
        <p className="font-body text-base text-slate-700 text-center">Thank you! You've already rated this session.</p>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="w-8 h-8"
              fill={i <= booking.rating ? "#B57E5D" : "none"}
              stroke={i <= booking.rating ? "#B57E5D" : "#cbd5e1"}
            />
          ))}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6" style={{ backgroundColor: "#F9F7F2" }}>
        <CheckCircle2 className="w-12 h-12" style={{ color: "#86A383" }} />
        <h1 className="font-display text-2xl text-slate-800">Thank you! 🙏</h1>
        <p className="font-body text-sm text-slate-500">Your feedback helps us improve.</p>
      </div>
    );
  }

  const formattedDate = booking.booking_date
    ? (() => { try { return format(new Date(booking.booking_date), "EEE d MMM"); } catch { return booking.booking_date; } })()
    : "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F7F2" }}>
      <div className="max-w-[430px] mx-auto flex flex-col items-center">
        <img src={cooqLogo} alt="Cooq" className="h-7 mt-8" />

        <h1 className="font-display text-2xl text-slate-800 mt-6">How was your session?</h1>
        <p className="font-body text-sm text-slate-500 mt-2">
          {booking.cook_name} · {formattedDate}
        </p>

        {/* Stars */}
        <div className="flex gap-4 justify-center mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="w-10 h-10 cursor-pointer transition-colors"
              fill={i <= (hoveredStar || selectedStar) ? "#B57E5D" : "none"}
              stroke={i <= (hoveredStar || selectedStar) ? "#B57E5D" : "#e2e8f0"}
              onMouseEnter={() => setHoveredStar(i)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setSelectedStar(i)}
            />
          ))}
        </div>
        {(hoveredStar || selectedStar) > 0 && (
          <p className="font-body text-xs text-slate-400 text-center mt-2">
            {starLabels[hoveredStar || selectedStar]}
          </p>
        )}

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tell us more (optional)"
          className="mt-6 mx-4 w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white p-4 font-body text-sm text-slate-700 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#86A383]"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selectedStar === 0 || submitting}
          className="mt-6 mx-4 w-[calc(100%-2rem)] py-4 rounded-xl font-body font-semibold text-base text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          style={{ backgroundColor: "#B57E5D" }}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : null}
          {submitting ? "Submitting..." : "Submit Rating"}
        </button>
      </div>
    </div>
  );
}
