import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { dubaiNeighborhoods } from "@/data/dubaiNeighborhoods";
import cooqLogo from "@/assets/cooq-logo.png";

const cuisineOptions = [
  "Lebanese", "Indian", "Mediterranean", "Continental", "Emirati", "Keto", "Vegan",
  "Filipino", "Pakistani", "Sri Lankan", "Thai", "Chinese", "Japanese", "Mexican", "American", "Italian",
];
const dietaryOptions = ["Gluten-free", "Dairy-free", "Nut-free", "Egg-free", "No restrictions"];
const frequencyOptions = [
  { key: "weekly", label: "Once a week" },
  { key: "twice", label: "Twice a week" },
  { key: "three", label: "3× a week" },
];

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

  const [neighborhood, setNeighborhood] = useState<string>(saved.neighborhood || "");
  const [selectedCuisine, setSelectedCuisine] = useState<string>(saved.cuisine || "");
  const [selectedDietary, setSelectedDietary] = useState<string>(saved.dietary || "");
  const [frequency, setFrequency] = useState<string>(saved.frequency || "");

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      neighborhood, cuisine: selectedCuisine, dietary: selectedDietary, frequency,
    }));
  }, [neighborhood, selectedCuisine, selectedDietary, frequency]);

  const handleFinal = () => {
    navigate("/results", {
      state: { neighborhood, cuisines: selectedCuisine ? [selectedCuisine] : [], dietary: selectedDietary ? [selectedDietary] : [], frequency },
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

      <div className="flex-1 px-6 pb-6 space-y-8 overflow-y-auto">
        {/* SECTION 1: Neighbourhood */}
        <div>
          <SectionLabel>Where are you based?</SectionLabel>
          <div className="relative">
            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 pb-2">
              {dubaiNeighborhoods.map((loc) => (
                <Pill
                  key={loc}
                  label={loc}
                  selected={neighborhood === loc}
                  onClick={() => setNeighborhood(neighborhood === loc ? "" : loc)}
                />
              ))}
            </div>
            {/* Bottom fade to indicate scroll */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>

        {/* SECTION 2: Cuisine */}
        {neighborhood && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionLabel>What cuisine are you looking for?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  selected={selectedCuisine === c}
                  onClick={() => setSelectedCuisine(selectedCuisine === c ? "" : c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: Dietary */}
        {neighborhood && selectedCuisine && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionLabel>Any dietary requirements?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((d) => (
                <Pill
                  key={d}
                  label={d}
                  selected={selectedDietary === d}
                  onClick={() => setSelectedDietary(selectedDietary === d ? "" : d)}
                />
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Frequency */}
        {neighborhood && selectedCuisine && selectedDietary && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionLabel>How often?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map((f) => (
                <Pill
                  key={f.key}
                  label={f.label}
                  selected={frequency === f.key}
                  onClick={() => setFrequency(frequency === f.key ? "" : f.key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {neighborhood && selectedCuisine && selectedDietary && frequency && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
            <button
              onClick={handleFinal}
              className="w-full py-4 rounded-lg font-body font-semibold text-base bg-copper text-accent-foreground transition-opacity hover:opacity-90"
            >
              Find My Cook →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
