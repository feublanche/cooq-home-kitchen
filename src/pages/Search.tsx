import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { dubaiNeighborhoods } from "@/data/dubaiNeighborhoods";
import cooqLogo from "@/assets/cooq-logo.png";
import { ChevronDown } from "lucide-react";

const PRICING = {
  'one-time':   { duo: 350,  family: 420,  large: 550  },
  'first-cook': { duo: 299,  family: 420,  large: 550  },
  'weekly':     { duo: 1190, family: 1430, large: 1870 },
  'twice':      { duo: 2380, family: 2860, large: 3740 },
  'three':      { duo: 3570, family: 4280, large: 5610 }
};

const SESSIONS = {
  'one-time': 1, 'first-cook': 1,
  'weekly': 4, 'twice': 8, 'three': 12
};

const SAVINGS = {
  'weekly': { duo: 210, family: 250, large: 330  },
  'twice':  { duo: 420, family: 500, large: 660  },
  'three':  { duo: 630, family: 760, large: 990  }
};

const cuisineOptions = ["Arabic", "Lebanese", "Emirati", "Moroccan", "Indian", "Pakistani", "Filipino", "Mediterranean", "Asian", "Italian"];
const dietaryOptions = ["Halal", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Kid-Friendly"];

const freqOptions = [
  {
    key: 'one-time',
    label: 'One-time',
    subtitle: 'Single session, no commitment',
    badge: null,
    rows: [
      { tier: 'Duo', people: '1–2 people', price: 'AED 350 / session' },
      { tier: 'Family', people: '3–4 people', price: 'AED 420 / session' },
      { tier: 'Large', people: '5–6 people', price: 'AED 550 / session' },
    ],
    savings: null
  },
  {
    key: 'weekly',
    label: 'Weekly',
    subtitle: '4 sessions per month',
    badge: 'Save 15%',
    rows: [
      { tier: 'Duo', people: '1–2 people', price: 'AED 1,190 / mo' },
      { tier: 'Family', people: '3–4 people', price: 'AED 1,430 / mo' },
      { tier: 'Large', people: '5–6 people', price: 'AED 1,870 / mo' },
    ],
    savings: 'You save AED 210 · 250 · 330 per month vs one-time'
  },
  {
    key: 'twice',
    label: 'Twice a week',
    subtitle: '8 sessions per month',
    badge: 'Save 15%',
    rows: [
      { tier: 'Duo', people: '1–2 people', price: 'AED 2,380 / mo' },
      { tier: 'Family', people: '3–4 people', price: 'AED 2,860 / mo' },
      { tier: 'Large', people: '5–6 people', price: 'AED 3,740 / mo' },
    ],
    savings: 'You save AED 420 · 500 · 660 per month vs one-time'
  },
  {
    key: 'three',
    label: '3× a week',
    subtitle: '12 sessions per month · Full week coverage',
    badge: 'Save 15%',
    rows: [
      { tier: 'Duo', people: '1–2 people', price: 'AED 3,570 / mo' },
      { tier: 'Family', people: '3–4 people', price: 'AED 4,280 / mo' },
      { tier: 'Large', people: '5–6 people', price: 'AED 5,610 / mo' },
    ],
    savings: 'You save AED 630 · 760 · 990 per month vs one-time'
  }
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
      case 2: return true;
      case 3: return true;
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
            <div className="space-y-3">
              {frequencyCards.map((f) => {
                const selected = frequency === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFrequency(f.key)}
                    className={`w-full text-left rounded-xl p-4 border-2 cursor-pointer transition-all ${
                      selected
                        ? "border-[#86A383] bg-[#86A383]/5"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[15px] font-semibold text-foreground">{f.title}</span>
                      {f.badge && (
                        <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(134,163,131,0.15)", color: "#86A383" }}>
                          {f.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-gray-400 mt-1">{f.line2}</p>
                    <p className="font-body text-xs mt-1" style={{ color: "#B57E5D" }}>{f.line3}</p>
                    {f.savings && (
                      <p className="font-body text-xs mt-1" style={{ color: "#86A383" }}>{f.savings}</p>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="font-body text-[11px] text-gray-400 italic mt-3">
              Prices shown as Duo · Family · Large. Your exact total confirmed on the booking page.
            </p>
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
