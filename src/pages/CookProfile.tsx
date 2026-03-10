import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBooking } from "@/context/BookingContext";
import { getCookById } from "@/data/cooks";
import { ArrowLeft, Star, Check, ShieldCheck } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const CookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const cook = getCookById(id || "");

  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [bookingType, setBookingType] = useState<"one-time" | "subscribe">("one-time");
  const [selectedDate, setSelectedDate] = useState<string>("");

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

  const price = bookingType === "subscribe" ? 297 : 350;
  const canBook = selectedMenu && selectedDate;

  const handleBook = () => {
    const menu = cook.menus.find((m) => m.id === selectedMenu);
    updateBooking({
      cookId: cook.id,
      cookName: `${cook.firstName} ${cook.lastInitial}.`,
      cookCuisine: cook.cuisine,
      menuSelected: menu?.name || "",
      menuPrice: price,
      bookingType,
      bookingDate: selectedDate,
      totalAed: price,
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

        {/* Signature Menus */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-4">Signature Menus</p>
        <div className="space-y-3 mb-6">
          {cook.menus.map((menu) => {
            const isSelected = selectedMenu === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setSelectedMenu(menu.id)}
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

        {selectedMenu && (
          <p className="font-body text-xs text-muted-foreground mb-6 italic">
            Auto grocery shopping list will be generated
          </p>
        )}

        {/* Booking type */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Booking Type</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setBookingType("one-time")}
            className={`p-3 rounded-lg border-2 font-body text-sm text-center transition-all ${
              bookingType === "one-time" ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span className="font-semibold">One-Time Trial</span>
            <br />
            <span className="text-copper font-semibold">AED 350</span>
          </button>
          <button
            onClick={() => setBookingType("subscribe")}
            className={`p-3 rounded-lg border-2 font-body text-sm text-center transition-all ${
              bookingType === "subscribe" ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span className="font-semibold">Subscribe Weekly</span>
            <br />
            <span className="text-copper font-semibold">AED 297/visit</span>
            <br />
            <span className="text-xs text-primary font-medium">save 15%</span>
          </button>
        </div>

        {/* Availability */}
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Available Dates</p>
        <div className="grid grid-cols-7 gap-1.5 mb-8">
          {next14Days.map((d) => {
            const key = d.toISOString().split("T")[0];
            const dayOfWeek = d.getDay();
            const available = cook.availableDays.includes(dayOfWeek);
            const isSelected = selectedDate === key;
            return (
              <button
                key={key}
                disabled={!available}
                onClick={() => setSelectedDate(key)}
                className={`flex flex-col items-center py-2 rounded-lg font-body text-xs transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : available
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

        {/* Book button */}
        <button
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
