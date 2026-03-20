import { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { data: cook, isLoading } = useQuery({
    queryKey: ["cook", id],
    queryFn: async () => {
      const { data } = await supabase.from("cooks").select("id, name, bio, cuisine, area, years_experience, health_card, photo_url").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: menus = [] } = useQuery({
    queryKey: ["cook-menus", id],
    queryFn: async () => {
      const { data } = await supabase.from("cook_menus").select("*").eq("cook_id", id!).eq("status", "approved");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["cook-avail", id],
    queryFn: async () => {
      try {
        const { data } = await supabase.from("cook_availability").select("*").eq("cook_id", id!).eq("available", true);
        return data || [];
      } catch { return []; }
    },
    enabled: !!id,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ["cook-blocked", id],
    queryFn: async () => {
      try {
        const { data } = await supabase.from("cook_blocked_dates" as any).select("blocked_date").eq("cook_id", id!);
        return (data || []).map((r: any) => r.blocked_date);
      } catch { return []; }
    },
    enabled: !!id,
  });

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d;
  }, []);

  const isAvailable = (date: Date) => {
    if (date < minDate || date > maxDate) return false;
    const dayIndex = (date.getDay() + 6) % 7;
    const str = date.toISOString().split("T")[0];
    return availability.some((a: any) => a.day_of_week === dayIndex && a.available) && !blockedDates.includes(str);
  };

  const getSlotsForDate = (date: Date) => {
    const dayIndex = (date.getDay() + 6) % 7;
    const match = availability.find((a: any) => a.day_of_week === dayIndex && a.available);
    return (match as any)?.time_slots || [];
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate("/results")} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <img src={cooqLogo} alt="Cooq" className="h-7" />
        </nav>
        <div className="px-6 animate-pulse space-y-4">
          <div className="w-24 h-24 rounded-full bg-muted mx-auto" />
          <div className="h-6 bg-muted rounded w-32 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="font-body text-lg text-foreground mb-4">Cook not found</p>
        <button onClick={() => navigate("/results")} className="font-body text-sm text-copper underline">← Back to cooks</button>
      </div>
    );
  }

  const initials = cook.name.split(" ").map((n: string) => n[0]).join(".") + ".";

  const handleBook = async () => {
    if (!selectedMenu || !selectedDate || !selectedSlot) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/account', { state: { returnTo: '/cook/' + id } });
      return;
    }
    if (session.user.email === 'cooqdubai@gmail.com') {
      navigate('/account', { state: { returnTo: '/cook/' + id } });
      return;
    }
    const { data: cookRecord } = await supabase
      .from('cooks').select('id').eq('user_id', session.user.id).maybeSingle();
    if (cookRecord) {
      navigate('/account', { state: { returnTo: '/cook/' + id } });
      return;
    }
    navigate('/book', {
      state: {
        cookId: cook.id,
        cookInitials: initials,
        cookArea: cook.area,
        selectedMenuId: selectedMenu.id,
        selectedMenuName: selectedMenu.menu_name,
        selectedMeals: selectedMenu.meals,
        bookingDate: selectedDate.toISOString().split("T")[0],
        bookingTime: selectedSlot,
        tier: (location.state as any)?.tier,
        frequency: (location.state as any)?.frequency,
      },
    });
  };

  const canBook = !!selectedMenu && !!selectedDate && !!selectedSlot;
  const bookLabel = selectedDate
    ? `Book for ${selectedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} →`
    : "Select a date to continue";

  const canGoPrev = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1) > new Date();
  const canGoNext = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1) <= maxDate;

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
          {cook.photo_url ? (
            <img src={cook.photo_url} alt="" className="w-24 h-24 rounded-full object-cover mb-4" style={{ filter: "blur(12px)" }} />
          ) : (
            <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: "#B57E5D", filter: "blur(12px)" }}>
              <span className="font-display text-3xl text-white">{initials}</span>
            </div>
          )}
          <h1 className="font-display italic text-2xl text-foreground">{initials}</h1>
          <p className="italic text-[10px] text-gray-400 mt-1">Full name &amp; photo revealed after booking</p>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {cook.cuisine?.join(" · ")} · {cook.area} · {cook.years_experience} years
          </p>
          <div className="flex items-center gap-2 mt-3">
            {cook.health_card && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-body text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Cooq Certified
              </span>
            )}
          </div>
          {cook.bio && (
            <p className="font-body text-sm text-muted-foreground mt-4 leading-relaxed max-w-sm">{cook.bio}</p>
          )}
        </div>

        {/* Calendar picker */}
        <div className="mb-6">
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Choose a date</p>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => canGoPrev && setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} disabled={!canGoPrev} className="p-1 disabled:opacity-20">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="font-body text-sm font-semibold text-[#2D312E]">{MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
              <button onClick={() => canGoNext && setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} disabled={!canGoNext} className="p-1 disabled:opacity-20">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES_SHORT.map(d => (
                <div key={d} className="text-center font-body text-[10px] text-gray-400 font-medium">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`e${i}`} />;
                const avail = isAvailable(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    disabled={!avail}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                    className={`w-full aspect-square rounded-full flex items-center justify-center font-body text-xs transition-colors ${
                      isSelected
                        ? "bg-[#2D312E] text-white ring-2 ring-[#86A383]"
                        : avail
                          ? "bg-[#86A383] text-white cursor-pointer hover:bg-[#759E72]"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="mb-6">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-2">Choose a time</p>
            <div className="flex flex-wrap gap-2">
              {getSlotsForDate(selectedDate).length === 0 ? (
                <p className="font-body text-xs text-muted-foreground italic">No time slots set for this day</p>
              ) : (
                getSlotsForDate(selectedDate).map((slot: string) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-full font-body text-xs border transition-colors ${
                      selectedSlot === slot
                        ? "bg-[#86A383] text-white border-[#86A383]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#86A383]"
                    }`}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Menu selection */}
        <div className="mb-6">
          <p className="text-[14px] font-semibold text-[#2D312E] mb-2">Choose your menu</p>
          {menus.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground italic">Menu coming soon</p>
          ) : (
            <div className="space-y-2">
              {menus.map((menu: any) => {
                const isSelected = selectedMenu?.id === menu.id;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setSelectedMenu(menu)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      isSelected ? "border-[#86A383] bg-[#86A383]/5" : "border-gray-100 bg-white"
                    }`}
                  >
                    <p className="font-body text-[13px] font-bold text-foreground">{menu.menu_name}</p>
                    {menu.cuisine && <p className="font-body text-[11px] text-copper mt-0.5">{menu.cuisine}</p>}
                    {menu.meals?.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {menu.meals.map((meal: string, i: number) => (
                          <p key={i} className="font-body text-[12px] text-gray-500">● {meal}</p>
                        ))}
                      </div>
                    )}
                    {menu.dietary?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {menu.dietary.map((d: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 font-body text-[9px] text-foreground">{d}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Book CTA */}
        <button
          type="button"
          disabled={!canBook}
          onClick={handleBook}
          className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          {canBook ? bookLabel : !selectedMenu ? "Select a menu above" : "Select a date and time"}
        </button>
      </div>
    </div>
  );
};

export default CookProfile;
