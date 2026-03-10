import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { ArrowLeft } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const locations = ["JBR", "Downtown", "Marina", "Arabian Ranches", "Palm Jumeirah", "Business Bay", "Jumeirah", "Other"];
const frequencies = ["Once a week", "Twice a week", "Three times a week"];
const mealOptions = ["Lunch", "Dinner"];
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const cuisineOptions = ["Lebanese", "Mediterranean", "Emirati", "Indian", "Pan-Asian", "Moroccan", "Healthy/Fitness", "International"];
const dietaryOptions = ["None", "Halal", "Gluten Free", "Keto", "Vegetarian", "Dairy Free", "Nut Allergy"];
const languageOptions = ["English", "Arabic", "Hindi", "Filipino", "French"];
const genderOptions = ["No preference", "Female cook", "Male cook"];

const frequencyToCount: Record<string, number> = {
  "Once a week": 1,
  "Twice a week": 2,
  "Three times a week": 3,
};

const Tile = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
    className={`px-4 py-4 rounded-lg font-body text-sm font-medium transition-all border cursor-pointer select-none relative z-10 ${
      selected
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-foreground border-border hover:border-primary/50 active:scale-95"
    }`}
    style={!selected ? { boxShadow: "var(--shadow-card)" } : {}}
  >
    {label}
  </button>
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4">{children}</p>
);

const Search = () => {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const [step, setStep] = useState(1);

  const maxDays = frequencyToCount[booking.frequency] || 1;

  const canNext = () => {
    switch (step) {
      case 1: return !!booking.location;
      case 2: return !!booking.frequency && booking.meals.length > 0;
      case 3: return booking.selectedDays.length === maxDays && booking.partySize >= 1;
      case 4: return booking.cuisines.length > 0;
      case 5: return booking.dietary.length > 0;
      case 6: return true; // language/gender are optional
      default: return false;
    }
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const toggleDay = (day: string) => {
    if (booking.selectedDays.includes(day)) {
      updateBooking({ selectedDays: booking.selectedDays.filter((d) => d !== day) });
    } else if (booking.selectedDays.length < maxDays) {
      updateBooking({ selectedDays: [...booking.selectedDays, day] });
    }
  };

  const handleFrequencyChange = (f: string) => {
    const newMax = frequencyToCount[f] || 1;
    // Reset selected days if more than new max
    const trimmedDays = booking.selectedDays.slice(0, newMax);
    updateBooking({ frequency: f, selectedDays: trimmedDays });
  };

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
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-colors ${s <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-2">Step {step} of 6</p>
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
                <Tile key={f} label={f} selected={booking.frequency === f} onClick={() => handleFrequencyChange(f)} />
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
            <SectionLabel>
              {maxDays === 1
                ? "Which day of the week?"
                : `Pick ${maxDays} days of the week`}
            </SectionLabel>
            <p className="font-body text-xs text-muted-foreground mb-4">
              {booking.selectedDays.length} of {maxDays} selected
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {weekDays.map((day) => {
                const isSelected = booking.selectedDays.includes(day);
                const isDisabled = !isSelected && booking.selectedDays.length >= maxDays;
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    disabled={isDisabled}
                    className={`px-4 py-3 rounded-lg font-body text-sm font-medium transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : isDisabled
                        ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                    style={!isSelected && !isDisabled ? { boxShadow: "var(--shadow-card)" } : {}}
                  >
                    {day}
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

        {step === 6 && (
          <div>
            <SectionLabel>Cook language preference</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {languageOptions.map((l) => (
                <Tile
                  key={l}
                  label={l}
                  selected={booking.languages.includes(l)}
                  onClick={() => updateBooking({ languages: toggleArray(booking.languages, l) })}
                />
              ))}
            </div>
            <SectionLabel>Cook gender preference</SectionLabel>
            <div className="grid grid-cols-1 gap-3">
              {genderOptions.map((g) => (
                <Tile
                  key={g}
                  label={g}
                  selected={booking.genderPreference === g}
                  onClick={() => updateBooking({ genderPreference: g })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-6">
        {step < 6 ? (
          <button
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
            className="w-full py-4 rounded-lg font-body font-semibold text-base bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            Next →
          </button>
        ) : (
          <button
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
