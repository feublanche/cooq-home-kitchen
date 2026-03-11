import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { cooks } from "@/data/cooks";
import { ArrowLeft, Star, ShieldCheck, ChefHat, MapPin, Clock } from "lucide-react";
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
          <div key={cook.id} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                <span className="font-display text-2xl text-primary">{cook.firstName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-foreground">
                  {cook.firstName} {cook.lastInitial}.
                </h3>

                {/* Cuisine specialties */}
                <div className="flex items-center gap-1.5 mt-1">
                  <ChefHat className="w-3.5 h-3.5 text-copper flex-shrink-0" />
                  <p className="font-body text-sm text-foreground font-medium">{cook.cuisine}</p>
                </div>

                {/* Areas */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="font-body text-xs text-muted-foreground">{cook.areas.join(" & ")}</p>
                </div>

                {/* Experience */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="font-body text-xs text-muted-foreground">{cook.yearsExperience} years experience</p>
                </div>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Cooq Certified shield */}
              {cook.certified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-body text-xs font-semibold text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  Cooq Certified
                </span>
              )}

              {/* Star rating */}
              {cook.rating ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-copper/10 font-body text-sm font-semibold text-copper">
                  <Star className="w-3.5 h-3.5 fill-copper" />
                  {cook.rating}
                </span>
              ) : cook.isNew ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-copper/10 text-copper font-body text-xs font-semibold">
                  NEW
                </span>
              ) : null}
            </div>

            {/* Certified tooltip */}
            {cook.certified && (
              <p className="font-body text-[10px] text-muted-foreground mt-2 leading-snug">
                <ShieldCheck className="w-3 h-3 inline text-primary mr-0.5 -mt-0.5" />
                Visa verified · Health certificate · Taste-test vetted
              </p>
            )}

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
