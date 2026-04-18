import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import StepProgress from "@/components/StepProgress";

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Filipino",
  "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican",
  "American", "Italian", "Keto/Healthy", "Vegan", "Other",
];
const dietaryOptions = ["Gluten-free", "Dairy-free", "Nut-free", "Low-carb", "Keto", "High-protein", "Vegan-friendly", "Vegetarian-friendly", "Family-friendly", "Postpartum/Nourishing", "Diabetic-friendly", "No restrictions"];

const SESSION_KEY = "cooq_search_state";

const Pill = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2.5 rounded-full text-sm cursor-pointer border transition-all ${
      selected
        ? "border-primary bg-primary/10 text-primary font-semibold"
        : "border-border bg-card text-foreground"
    }`}
  >
    {label}
  </button>
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">{children}</p>
);

const Search = () => {
  const navigate = useNavigate();

  const saved = (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
  })();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(saved.cuisines || []);
  const [selectedDietaries, setSelectedDietaries] = useState<string[]>(saved.dietaries || []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      cuisines: selectedCuisines, dietaries: selectedDietaries,
    }));
  }, [selectedCuisines, selectedDietaries]);

  const handleFinal = () => {
    navigate("/results", {
      state: { cuisines: selectedCuisines, dietary: selectedDietaries },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>
      <StepProgress current={0} />

      <div className="flex-1 px-6 pb-32 space-y-8 overflow-y-auto">
        {/* SECTION 1: Cuisine (multi-select) */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SectionLabel>What cuisine are you looking for?</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((c) => (
              <Pill
                key={c}
                label={c}
                selected={selectedCuisines.includes(c)}
                onClick={() => {
                  setSelectedCuisines(prev =>
                    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                  );
                }}
              />
            ))}
          </div>
        </div>

        {/* SECTION 2: Dietary (always visible) */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SectionLabel>Any dietary requirements? (optional)</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((d) => (
              <Pill
                key={d}
                label={d}
                selected={selectedDietaries.includes(d)}
                onClick={() => {
                  setSelectedDietaries(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                  );
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA — always visible, sticky at bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-6 py-4 z-40">
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={handleFinal}
            className="w-full py-4 rounded-lg font-body font-semibold text-base bg-copper text-accent-foreground transition-opacity hover:opacity-90"
          >
            Find My Cook →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Search;
