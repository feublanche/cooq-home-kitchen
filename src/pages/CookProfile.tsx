import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { getCookById } from "@/data/cooks";
import { getGroceryListForMenu, getPantryListForMenu, categoryIcons } from "@/data/groceryData";
import { ArrowLeft, Star, Check, ShieldCheck, RefreshCw, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const addOnOptions = ["Soups", "Snacks", "Desserts", "Sides"];

const frequencyToCount: Record<string, number> = {
  "Once a week": 1,
  "Twice a week": 2,
  "Three times a week": 3,
};

const CookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const cook = getCookById(id || "");

  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [selectedMenuDinner, setSelectedMenuDinner] = useState<string>("");
  const [bookingType, setBookingType] = useState<"one-time" | "subscribe">("one-time");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Swap credits
  const [swapMode, setSwapMode] = useState(false);
  const [swaps, setSwaps] = useState<{ original: string; replacement: string }[]>([]);
  const [swapOriginal, setSwapOriginal] = useState("");
  const [swapReplacement, setSwapReplacement] = useState("");

  const next14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  if (!cook) return <div className="p-6 font-body">Cook not found.</div>;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentMenu = cook.menus.find((m) => m.id === selectedMenu);
  const hasBothMeals = booking.meals.includes("Lunch") && booking.meals.includes("Dinner");
  const maxDates = frequencyToCount[booking.frequency] || 1;
  const mealMultiplier = hasBothMeals ? 2 : 1;

  const basePrice = bookingType === "subscribe" ? 297 : 350;
  const perVisitPrice = basePrice * mealMultiplier;
  const needsBothMenus = hasBothMeals;
  const canBook = selectedMenu && selectedDates.length === maxDates && (!needsBothMenus || selectedMenuDinner);

  const toggleDate = (key: string) => {
    if (selectedDates.includes(key)) {
      setSelectedDates(selectedDates.filter((d) => d !== key));
    } else if (selectedDates.length < maxDates) {
      setSelectedDates([...selectedDates, key]);
    }
  };

  const toggleAddOn = (a: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const addSwap = () => {
    if (swapOriginal && swapReplacement && swaps.length < 2) {
      setSwaps([...swaps, { original: swapOriginal, replacement: swapReplacement }]);
      setSwapOriginal("");
      setSwapReplacement("");
      if (swaps.length + 1 >= 2) setSwapMode(false);
    }
  };

  const removeSwap = (i: number) => {
    setSwaps(swaps.filter((_, idx) => idx !== i));
  };

  const handleBook = () => {
    const menu = cook.menus.find((m) => m.id === selectedMenu);
    const menuD = cook.menus.find((m) => m.id === selectedMenuDinner);
    updateBooking({
      cookId: cook.id,
      cookName: `${cook.firstName} ${cook.lastInitial}.`,
      cookCuisine: cook.cuisine,
      menuSelected: menu?.name || "",
      menuSelectedDinner: menuD?.name || "",
      menuPrice: perVisitPrice,
      bookingType,
      bookingDates: selectedDates,
      totalAed: perVisitPrice,
      addOns: selectedAddOns,
      swappedDishes: swaps,
    });
    navigate("/book");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/results")} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 pb-6">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
            <span className="font-display text-3xl text-primary">{cook.firstName[0]}</span>
          </div>
          <h1 className="font-display italic text-2xl text-foreground">
            {cook.firstName} {cook.lastInitial}.
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {cook.cuisine} · {cook.areas.join(" & ")} · {cook.yearsExperience} years
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-body text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Cooq Certified
            </span>
            {cook.rating && (
              <span className="flex items-center gap-1 font-body text-sm">
                <Star className="w-4 h-4 text-copper fill-copper" /> {cook.rating}
              </span>
            )}
            {cook.isNew && (
              <span className="px-2 py-0.5 rounded-full bg-copper/10 text-copper font-body text-xs font-semibold">NEW</span>
            )}
          </div>
          <p className="font-body text-sm text-muted-foreground mt-4 leading-relaxed max-w-sm">{cook.bio}</p>
        </div>

        {/* Signature Menus — Lunch (or single meal) */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4">
          {needsBothMenus ? "Lunch Menu" : "Signature Menus"}
        </p>
        <div className="space-y-3 mb-4">
          {cook.menus.map((menu) => {
            const isSelected = selectedMenu === menu.id;
            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => {
                  setSelectedMenu(menu.id);
                  setSwaps([]);
                  setSwapMode(false);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
                style={!isSelected ? { boxShadow: "var(--shadow-card)" } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display text-base text-foreground">{menu.name}</h3>
                  {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                </div>
                <p className="font-body text-xs text-muted-foreground mb-2">5 meals per visit</p>
                <p className="font-body text-sm text-foreground">{menu.meals.join(", ")}</p>
                {menu.addOns && (
                  <p className="font-body text-xs text-muted-foreground mt-1">+ Optional: {menu.addOns}</p>
                )}
                <p className="font-body text-base font-semibold text-copper mt-3">AED {menu.pricePerVisit} per visit</p>
              </button>
            );
          })}
        </div>

        {/* Dinner Menu — only if both Lunch & Dinner selected */}
        {needsBothMenus && (
          <>
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4 mt-6">
              Dinner Menu
            </p>
            <div className="space-y-3 mb-4">
              {cook.menus.map((menu) => {
                const isSelected = selectedMenuDinner === menu.id;
                return (
                  <button
                    key={`dinner-${menu.id}`}
                    type="button"
                    onClick={() => setSelectedMenuDinner(menu.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    style={!isSelected ? { boxShadow: "var(--shadow-card)" } : {}}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-base text-foreground">{menu.name}</h3>
                      {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                    </div>
                    <p className="font-body text-xs text-muted-foreground mb-2">5 meals per visit</p>
                    <p className="font-body text-sm text-foreground">{menu.meals.join(", ")}</p>
                    <p className="font-body text-base font-semibold text-copper mt-3">AED {menu.pricePerVisit} per visit</p>
                  </button>
                );
              })}
            </div>
            <p className="font-body text-xs text-primary font-medium mb-4">
              💡 Lunch + Dinner = 2× per visit pricing
            </p>
          </>
        )}

        {/* Grocery & Pantry Lists */}
        {selectedMenu && currentMenu && (
          <GroceryPantrySection meals={currentMenu.meals} />
        )}

        {/* Swap Credits */}
        {selectedMenu && currentMenu && (
          <div className="mb-6">

            <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <p className="font-body text-sm font-semibold text-foreground">
                  Swap Credits: {2 - swaps.length} remaining
                </p>
              </div>
              <p className="font-body text-xs text-muted-foreground mb-3">
                Personalise your menu — swap up to 2 dishes
              </p>

              {swaps.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 mb-2">
                  <span className="font-body text-xs text-foreground">
                    <span className="line-through text-muted-foreground">{s.original}</span> → {s.replacement}
                  </span>
                  <button onClick={() => removeSwap(i)} className="font-body text-xs text-destructive">✕</button>
                </div>
              ))}

              {swaps.length < 2 && (
                <>
                  {!swapMode ? (
                    <button
                      type="button"
                      onClick={() => setSwapMode(true)}
                      className="font-body text-xs text-copper font-medium"
                    >
                      + Use a swap credit
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={swapOriginal}
                        onChange={(e) => setSwapOriginal(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border bg-card font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Dish to remove...</option>
                        {currentMenu.meals
                          .filter((m) => !swaps.some((s) => s.original === m))
                          .map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                      </select>
                      <input
                        value={swapReplacement}
                        onChange={(e) => setSwapReplacement(e.target.value)}
                        placeholder="Replace with..."
                        className="w-full p-2 rounded-lg border border-border bg-card font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={addSwap}
                          disabled={!swapOriginal || !swapReplacement}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-body text-xs font-medium disabled:opacity-40"
                        >
                          Confirm Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSwapMode(false); setSwapOriginal(""); setSwapReplacement(""); }}
                          className="px-3 py-1.5 rounded-lg bg-muted text-foreground font-body text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {selectedMenu && (
          <>
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Add-ons</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {addOnOptions.map((a) => {
                const isSelected = selectedAddOns.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAddOn(a)}
                    className={`px-4 py-3 rounded-lg font-body text-sm font-medium transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                    style={!isSelected ? { boxShadow: "var(--shadow-card)" } : {}}
                  >
                    {a}
                    <span className="block text-xs mt-0.5 opacity-75">+AED 25</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Booking type */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Booking Type</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setBookingType("one-time")}
            className={`p-3 rounded-lg border-2 font-body text-sm text-center transition-all ${
              bookingType === "one-time" ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span className="font-semibold">One-Time Trial</span>
            <br />
            <span className="text-copper font-semibold">AED {350 * mealMultiplier}</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType("subscribe")}
            className={`p-3 rounded-lg border-2 font-body text-sm text-center transition-all ${
              bookingType === "subscribe" ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span className="font-semibold">Subscribe Weekly</span>
            <br />
            <span className="text-copper font-semibold">AED {297 * mealMultiplier}/visit</span>
            <br />
            <span className="text-xs text-primary font-medium">save 15%</span>
          </button>
        </div>

        {/* Availability — multi-date selection */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-2">Available Dates</p>
        <p className="font-body text-xs text-muted-foreground mb-3">
          Select {maxDates} date{maxDates > 1 ? "s" : ""} · {selectedDates.length} of {maxDates} chosen
        </p>
        <div className="grid grid-cols-7 gap-1.5 mb-8">
          {next14Days.map((d) => {
            const key = d.toISOString().split("T")[0];
            const dayOfWeek = d.getDay();
            const available = cook.availableDays.includes(dayOfWeek);
            const isSelected = selectedDates.includes(key);
            const isDisabled = !available || (!isSelected && selectedDates.length >= maxDates);
            return (
              <button
                key={key}
                type="button"
                disabled={isDisabled}
                onClick={() => toggleDate(key)}
                className={`flex flex-col items-center py-2 rounded-lg font-body text-xs transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : available && !isDisabled
                    ? "bg-card text-foreground border border-border hover:border-primary"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                <span>{dayNames[d.getDay()]}</span>
                <span className="text-sm font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Price summary */}
        <div className="bg-card rounded-xl p-4 mb-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="space-y-1 font-body text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Base price per visit</span>
              <span>AED {basePrice}</span>
            </div>
            {hasBothMeals && (
              <div className="flex justify-between text-muted-foreground">
                <span>× 2 meals (Lunch + Dinner)</span>
                <span>AED {basePrice * 2}</span>
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between font-semibold text-foreground">
              <span>Per visit total</span>
              <span className="text-copper">AED {perVisitPrice}</span>
            </div>
          </div>
        </div>

        {/* Book button */}
        <button
          type="button"
          disabled={!canBook}
          onClick={handleBook}
          className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          Book {cook.firstName} {cook.lastInitial}. →
        </button>
      </div>
    </div>
  );
};

export default CookProfile;
