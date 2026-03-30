import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, MapPin } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const saved = (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
  })();

  const [neighborhood, setNeighborhood] = useState<string>(saved.neighborhood || "");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(saved.cuisines || []);
  const [selectedDietaries, setSelectedDietaries] = useState<string[]>(saved.dietaries || []);
  const [frequency, setFrequency] = useState<string>(saved.frequency || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      neighborhood, cuisines: selectedCuisines, dietaries: selectedDietaries, frequency,
    }));
  }, [neighborhood, selectedCuisines, selectedDietaries, frequency]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNeighborhoods = dubaiNeighborhoods.filter((n) =>
    n.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* SECTION 1: Neighbourhood dropdown */}
        <div ref={dropdownRef} className="relative">
          <SectionLabel>Where are you based?</SectionLabel>
          <button
            type="button"
            onClick={() => { setDropdownOpen(!dropdownOpen); setSearchQuery(""); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
              neighborhood
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            <MapPin className={`w-4 h-4 flex-shrink-0 ${neighborhood ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`flex-1 font-body text-sm ${neighborhood ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {neighborhood || "Select your neighbourhood"}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search neighbourhood…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {filteredNeighborhoods.length === 0 ? (
                  <p className="px-4 py-3 font-body text-sm text-muted-foreground">No areas found</p>
                ) : (
                  filteredNeighborhoods.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        if (neighborhood === loc) {
                          setNeighborhood(""); setSelectedCuisine(""); setSelectedDietary(""); setFrequency("");
                        } else {
                          setNeighborhood(loc);
                        }
                        setDropdownOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-4 py-2.5 font-body text-sm transition-colors ${
                        neighborhood === loc
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {loc}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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
                  onClick={() => { if (selectedCuisine === c) { setSelectedCuisine(""); setSelectedDietary(""); setFrequency(""); } else { setSelectedCuisine(c); } }}
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
                  onClick={() => { if (selectedDietary === d) { setSelectedDietary(""); setFrequency(""); } else { setSelectedDietary(d); } }}
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
