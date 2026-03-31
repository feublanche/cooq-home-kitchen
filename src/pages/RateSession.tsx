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

const CATEGORIES = [
  { key: "taste", label: "Food taste" },
  { key: "punctuality", label: "Punctuality" },
  { key: "cleanliness", label: "Kitchen cleanliness" },
  { key: "communication", label: "Communication" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

export default function RateSession() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStars, setHoveredStars] = useState<Record<CategoryKey, number>>({ taste: 0, punctuality: 0, cleanliness: 0, communication: 0 });
  const [selectedStars, setSelectedStars] = useState<Record<CategoryKey, number>>({ taste: 0, punctuality: 0, cleanliness: 0, communication: 0 });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      const { data } = await supabase.rpc("get_booking_for_rating", {
        booking_uuid: bookingId,
      });
      if (data && data.length > 0) {
        setBooking(data[0]);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const allRated = CATEGORIES.every(c => selectedStars[c.key] > 0);
  const overallAvg = allRated
    ? Math.round(CATEGORIES.reduce((sum, c) => sum + selectedStars[c.key], 0) / CATEGORIES.length)
    : 0;

  const handleSubmit = async () => {
    if (!allRated || !bookingId) return;
    setSubmitting(true);
    await supabase.rpc("submit_booking_rating", {
      booking_uuid: bookingId,
      p_rating: overallAvg,
      p_note: note || null,
      p_taste: selectedStars.taste,
      p_punctuality: selectedStars.punctuality,
      p_cleanliness: selectedStars.cleanliness,
      p_communication: selectedStars.communication,
    } as any);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="font-body text-muted-foreground">Booking not found.</p>
        <button onClick={() => navigate("/")} className="mt-4 font-body text-sm underline text-primary">
          Go home
        </button>
      </div>
    );
  }

  if (submitted || booking.rating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <CheckCircle2 className="w-16 h-16 mb-4 text-primary" />
        <h1 className="font-display italic text-2xl text-foreground mb-2">Thank you!</h1>
        <p className="font-body text-muted-foreground text-center">
          Your feedback helps us improve the Cooq experience.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="flex-1 px-6 pb-8">
        <h1 className="font-display italic text-2xl text-foreground mb-1">Rate your session</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          How was your experience with {booking.cook_name}
          {booking.booking_date ? ` on ${format(new Date(booking.booking_date), "d MMM")}` : ""}?
        </p>

        {/* Category ratings */}
        <div className="space-y-6 mb-6">
          {CATEGORIES.map(cat => {
            const hovered = hoveredStars[cat.key];
            const selected = selectedStars[cat.key];
            const display = hovered || selected;
            return (
              <div key={cat.key}>
                <p className="font-body text-sm font-semibold text-foreground mb-2">{cat.label}</p>
                <div className="flex gap-2 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoveredStars(prev => ({ ...prev, [cat.key]: s }))}
                      onMouseLeave={() => setHoveredStars(prev => ({ ...prev, [cat.key]: 0 }))}
                      onClick={() => setSelectedStars(prev => ({ ...prev, [cat.key]: s }))}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-8 h-8"
                        fill={s <= display ? "#F5C542" : "none"}
                        stroke={s <= display ? "#F5C542" : "hsl(var(--border))"}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                <p className="font-body text-xs text-muted-foreground h-4">
                  {starLabels[display] || ""}
                </p>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any comments? (optional)"
          rows={3}
          className="w-full border border-border rounded-xl p-3 font-body text-sm text-foreground bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={!allRated || submitting}
          className="w-full py-4 rounded-xl font-body font-semibold text-base text-accent-foreground bg-copper disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Rating"}
        </button>
      </div>
    </div>
  );
}
