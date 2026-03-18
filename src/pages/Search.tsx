import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { dubaiNeighborhoods } from "@/data/dubaiNeighborhoods";
import cooqLogo from "@/assets/cooq-logo.png";
import { ChevronDown } from "lucide-react";

const cuisineOptions = ["Arabic", "Lebanese", "Emirati", "Moroccan", "Indian", "Pakistani", "Filipino", "Mediterranean", "Asian", "Italian"];
const dietaryOptions = ["Halal", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Kid-Friendly"];
const frequencyOptions = [
  { key: "one-time", label: "One-time" },
  { key: "weekly", label: "Weekly (save 15%)" },
  { key: "twice-weekly", label: "Twice a week" },
  { key: "three-weekly", label: "Three times a week" },
];
const tierOptions = [
  { key: "duo", label: "Cooq Duo", desc: "1–2 people", price: "AED 350" },
  { key: "family", label: "Cooq Family", desc: "3–4 people", price: "AED 420" },
  { key: "large", label: "Cooq Large", desc: "5–6 people", price: "AED 550" },
];

const Pill = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm cursor-pointer border transition-all ${
      selected
        ? "border-[#86A383] bg-[#86A383]/10 text-[#86A383] font-semibold"
        : "border-gray-200 bg-white text-gray-600"
    }`}
  >
    {label}
  </button>
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4">{children}</p>
);

const Search = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [neighborhood, setNeighborhood] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [tier, setTier] = useState("");

  const totalSteps = 5;

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const canNext = () => {
    switch (step) {
      case 1: return !!neighborhood;
      case 2: return true; // any cuisine is optional
      case 3: return true; // dietary optional
      case 4: return !!frequency;
      case 5: return !!tier;
      default: return false;
    }
  };

  const handleFinal = () => {
    navigate("/results", {
      state: { neighborhood, cuisines: selectedCuisines, dietary: selectedDietary, frequency, tier },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <p className="font-body text-xs text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
      </div>

      <div className="flex-1 px-6 pb-6">
        {step === 1 && (
          <div>
            <SectionLabel>Where are you based?</SectionLabel>
            <div className="relative">
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full p-4 pr-10 rounded-lg border border-border bg-card font-body text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <option value="">Select your neighborhood...</option>
                {dubaiNeighborhoods.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionLabel>What cuisine are you looking for?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Pill
                label="Any cuisine"
                selected={selectedCuisines.length === 0}
                onClick={() => setSelectedCuisines([])}
              />
              {cuisineOptions.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  selected={selectedCuisines.includes(c)}
                  onClick={() => setSelectedCuisines(toggleArr(selectedCuisines, c))}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionLabel>Any dietary requirements?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Pill
                label="No preference"
                selected={selectedDietary.length === 0}
                onClick={() => setSelectedDietary([])}
              />
              {dietaryOptions.map((d) => (
                <Pill
                  key={d}
                  label={d}
                  selected={selectedDietary.includes(d)}
                  onClick={() => setSelectedDietary(toggleArr(selectedDietary, d))}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <SectionLabel>How often?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map((f) => (
                <Pill
                  key={f.key}
                  label={f.label}
                  selected={frequency === f.key}
                  onClick={() => setFrequency(f.key)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <SectionLabel>Session size?</SectionLabel>
            <div className="space-y-3">
              {tierOptions.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTier(t.key)}
                  className={`w-full text-left rounded-xl p-4 border-2 transition-colors ${
                    tier === t.key
                      ? "border-[#86A383] bg-[#86A383]/5"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <p className="font-body text-sm font-bold text-foreground">{t.label}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.desc} · {t.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {step < totalSteps ? (
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
            onClick={handleFinal}
            className="w-full py-4 rounded-lg font-body font-semibold text-base bg-copper text-accent-foreground disabled:opacity-40 transition-opacity"
          >
            Find My Cook →
          </button>
        )}
      </div>
    </div>
  );
};

export default Search;
