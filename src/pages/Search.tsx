import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const locations = ["JBR", "Downtown", "Marina", "Arabian Ranches", "Palm Jumeirah", "Business Bay", "Jumeirah", "Other"];
const frequencies = ["Once a week", "Twice a week", "Three times a week"];
const mealOptions = ["Lunch", "Dinner"];
const cuisineOptions = ["Lebanese", "Mediterranean", "Emirati", "Indian", "Pan-Asian", "Moroccan", "Healthy/Fitness", "International"];
const dietaryOptions = ["None", "Halal", "Gluten Free", "Keto", "Vegetarian", "Dairy Free", "Nut Allergy"];

const Search = () => {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const [step, setStep] = useState(1);

  // Local state for step 3 calendar
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const canNext = () => {
    switch (step) {
      case 1: return !!booking.location;
      case 2: return !!booking.frequency && booking.meals.length > 0;
      case 3: return !!booking.startDate && booking.partySize >= 1;
      case 4: return booking.cuisines.length > 0;
      case 5: return booking.dietary.length > 0;
      default: return false;
    }
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const Tile = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-lg font-body text-sm font-medium transition-all border ${
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:border-primary/50"
      }`}
      style={!selected ? { boxShadow: "var(--shadow-card)" } : {}}
    >
      {label}
    </button>
  );

  const SectionLabel = ({ children }: { children: string }) => (
    <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4">{children}</p>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-colors ${s <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-2">Step {step} of 5</p>
      </div>

      {/* Steps */}
      <div className="flex-1 px-6 pb-6">
        {step === 1 && (
          <div>
            <SectionLabel>Where are you based?</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {locations.map((loc) => (
                <Tile key={loc} label={loc} selected={booking.location === loc} onClick={() => updateBooking({ location: loc })} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionLabel>How often?</SectionLabel>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {frequencies.map((f) => (
                <Tile key={f} label={f} selected={booking.frequency === f} onClick={() => updateBooking({ frequency: f })} />
              ))}
            </div>
            <SectionLabel>Which meals?</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {mealOptions.map((m) => (
                <Tile
                  key={m}
                  label={m}
                  selected={booking.meals.includes(m)}
                  onClick={() => updateBooking({ meals: toggleArray(booking.meals, m) })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionLabel>When do you need your cook?</SectionLabel>
            <div className="grid grid-cols-7 gap-2 mb-8">
              {next7Days.map((d) => {
                const key = d.toISOString().split("T")[0];
                const selected = booking.startDate === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateBooking({ startDate: key })}
                    className={`flex flex-col items-center py-3 rounded-lg font-body text-xs transition-all ${
                      selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                    }`}
                    style={!selected ? { boxShadow: "var(--shadow-card)" } : {}}
                  >
                    <span className="font-medium">{dayNames[d.getDay()]}</span>
                    <span className="text-lg font-semibold">{d.getDate()}</span>
                    <span>{monthNames[d.getMonth()]}</span>
                  </button>
                );
              })}
            </div>

            <SectionLabel>How many people?</SectionLabel>
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateBooking({ partySize: Math.max(1, booking.partySize - 1) })}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-body text-lg font-bold"
              >
                −
              </button>
              <span className="font-body text-2xl font-semibold w-8 text-center">{booking.partySize}</span>
              <button
                onClick={() => updateBooking({ partySize: Math.min(20, booking.partySize + 1) })}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-body text-lg font-bold"
              >
                +
              </button>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-2">2 children = 1 adult</p>
          </div>
        )}

        {step === 4 && (
          <div>
            <SectionLabel>What cuisines do you love?</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {cuisineOptions.map((c) => (
                <Tile
                  key={c}
                  label={c}
                  selected={booking.cuisines.includes(c)}
                  onClick={() => updateBooking({ cuisines: toggleArray(booking.cuisines, c) })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <SectionLabel>Any dietary needs?</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {dietaryOptions.map((d) => (
                <Tile
                  key={d}
                  label={d}
                  selected={booking.dietary.includes(d)}
                  onClick={() => updateBooking({ dietary: toggleArray(booking.dietary, d) })}
                />
              ))}
            </div>
            <textarea
              placeholder="Any other allergies or notes?"
              value={booking.allergyNotes}
              onChange={(e) => updateBooking({ allergyNotes: e.target.value })}
              className="w-full p-4 rounded-lg border border-border bg-card font-body text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-6">
        {step < 5 ? (
          <button
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
            className="w-full py-4 rounded-lg font-body font-semibold text-base bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            Next →
          </button>
        ) : (
          <button
            disabled={!canNext()}
            onClick={() => navigate("/results")}
            className="w-full py-4 rounded-lg font-body font-semibold text-base bg-copper text-accent-foreground disabled:opacity-40 transition-opacity"
          >
            Show Me My Cooks →
          </button>
        )}
      </div>
    </div>
  );
};

export default Search;
