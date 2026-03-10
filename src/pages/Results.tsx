import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { cooks } from "@/data/cooks";
import { ArrowLeft, Star, Check } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Results = () => {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();

  const summary = [
    ...booking.cuisines.slice(0, 2),
    booking.location,
    booking.frequency,
    ...booking.dietary.filter((d) => d !== "None"),
  ]
    .filter(Boolean)
    .join(" · ");

  const daysDisplay = booking.selectedDays.length > 0
    ? booking.selectedDays.join(", ")
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/search")} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 pb-4">
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Your Matches</p>
        <h1 className="font-display italic text-2xl text-foreground mb-2">3 cooks match your preferences</h1>
        <p className="font-body text-sm text-muted-foreground">{summary}</p>
        {daysDisplay && (
          <p className="font-body text-xs text-muted-foreground mt-1">Days: {daysDisplay}</p>
        )}
      </div>

      <div className="flex-1 px-6 pb-6 space-y-4">
        {cooks.map((cook) => (
          <div key={cook.id} className="bg-card rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex gap-4">
              {/* Blurred photo placeholder */}
              <div className="w-16 h-16 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden" style={{ filter: "blur(8px)" }}>
                <div className="w-full h-full bg-primary/40" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg text-foreground">
                  {cook.firstName} {cook.lastInitial}.
                </h3>
                <p className="font-body text-sm text-muted-foreground">{cook.cuisine}</p>
                <p className="font-body text-xs text-muted-foreground">
                  Serves {cook.areas.join(" & ")} · {cook.yearsExperience} years
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {cook.isNew ? (
                    <span className="px-2 py-0.5 rounded-full bg-copper/10 text-copper font-body text-xs font-semibold">NEW</span>
                  ) : (
                    <span className="flex items-center gap-1 font-body text-sm text-foreground">
                      <Star className="w-3.5 h-3.5 text-copper fill-copper" />
                      {cook.rating}
                    </span>
                  )}
                  {cook.certified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body text-xs font-medium">
                      <Check className="w-3 h-3" /> Cooq Certified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                updateBooking({
                  cookId: cook.id,
                  cookName: `${cook.firstName} ${cook.lastInitial}.`,
                  cookCuisine: cook.cuisine,
                });
                navigate(`/cook/${cook.id}`);
              }}
              className="w-full mt-4 py-3 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              View Profile →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
