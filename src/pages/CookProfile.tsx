import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, Check, Star } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import { Progress } from "@/components/ui/progress";

const RATING_CATEGORIES = [
  { key: "taste_rating", label: "Food taste" },
  { key: "punctuality_rating", label: "Punctuality" },
  { key: "cleanliness_rating", label: "Cleanliness" },
  { key: "communication_rating", label: "Communication" },
] as const;

const CookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  const { data: cook, isLoading } = useQuery({
    queryKey: ["cook", id],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("get_public_cook_by_id", { cook_uuid: id! });
      return rows?.[0] || null;
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

  const { data: ratingData } = useQuery({
    queryKey: ["cook-rating-breakdown", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("rating, taste_rating, punctuality_rating, cleanliness_rating, communication_rating")
        .eq("cook_id", id!)
        .not("rating", "is", null);
      if (!data || data.length === 0) return null;
      const count = data.length;
      const avgOverall = data.reduce((s, b) => s + (b.rating || 0), 0) / count;
      const avgs: Record<string, number> = {};
      for (const cat of RATING_CATEGORIES) {
        const vals = data.filter(b => (b as any)[cat.key] != null);
        avgs[cat.key] = vals.length > 0 ? vals.reduce((s, b) => s + ((b as any)[cat.key] || 0), 0) / vals.length : 0;
      }
      return { count, avgOverall, avgs };
    },
    enabled: !!id,
  });

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
    if (!selectedMenu) return;
    const bookingState = {
      cookId: cook.id,
      cookInitials: initials,
      menuName: selectedMenu.menu_name,
      cookArea: cook.area,
      selectedMenuId: selectedMenu.id,
      selectedMenuName: selectedMenu.menu_name,
      selectedMeals: selectedMenu.meals,
      tier: (location.state as any)?.tier,
      frequency: (location.state as any)?.frequency,
    };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("cooq_pending_booking", JSON.stringify(bookingState));
      navigate("/account", { state: { returnTo: "/cook/" + id } });
      return;
    }
    if (session.user.email === "cooqdubai@gmail.com") {
      sessionStorage.setItem("cooq_pending_booking", JSON.stringify(bookingState));
      navigate("/account", { state: { returnTo: "/cook/" + id } });
      return;
    }
    const { data: cookRecord } = await supabase.from("cooks").select("id").eq("user_id", session.user.id).maybeSingle();
    if (cookRecord) {
      sessionStorage.setItem("cooq_pending_booking", JSON.stringify(bookingState));
      navigate("/account", { state: { returnTo: "/cook/" + id } });
      return;
    }
    navigate("/book", { state: bookingState });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/results")} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 pb-6">
        <div className="flex flex-col items-center text-center mb-8">
          {cook.photo_url ? (
            <img src={cook.photo_url} alt="" className="w-24 h-24 rounded-full object-cover mb-4" style={{ filter: "blur(12px)" }} />
          ) : (
            <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center bg-copper" style={{ filter: "blur(12px)" }}>
              <span className="font-display text-3xl text-primary-foreground">{initials}</span>
            </div>
          )}
          <h1 className="font-display italic text-2xl text-foreground">{initials}</h1>
          <p className="italic text-[10px] text-muted-foreground mt-1">Full name &amp; photo revealed after booking</p>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {cook.cuisine?.join(" · ")} · {cook.years_experience} years experience
          </p>
          <div className="flex flex-col items-center gap-1.5 mt-3">
            {cook.status === "approved" && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-body text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> ✦ Cooq Certified
              </span>
            )}
            {cook.health_card && (
              <span className="font-body text-[10px] text-muted-foreground">Health Card ✓</span>
            )}
          </div>
          {cook.bio && (
            <p className="font-body text-sm text-muted-foreground mt-4 leading-relaxed max-w-sm">{cook.bio}</p>
          )}
        </div>

        {/* Rating breakdown */}
        {ratingData && ratingData.count > 0 && (
          <div className="mb-8 bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-display text-lg font-bold text-foreground">{ratingData.avgOverall.toFixed(1)}</span>
              <span className="font-body text-sm text-muted-foreground">· {ratingData.count} review{ratingData.count !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {RATING_CATEGORIES.map(cat => {
                const avg = ratingData.avgs[cat.key] || 0;
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="font-body text-xs text-muted-foreground w-28 flex-shrink-0">{cat.label}</span>
                    <Progress value={(avg / 5) * 100} className="h-2 flex-1 bg-primary/20" />
                    <span className="font-body text-xs font-semibold text-foreground w-8 text-right">{avg.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu selection */}
        <div className="mb-6">
          <p className="text-[14px] font-semibold text-foreground mb-2">Choose your menu</p>
          {menus.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground italic">Menu coming soon</p>
          ) : (
            <div className="space-y-2">
              {menus.map((menu: any) => {
                const isSelected = selectedMenu?.id === menu.id;
                const dietaryFiltered = (menu.dietary || []).filter((d: string) => d.toLowerCase() !== "halal");
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setSelectedMenu(menu)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors cursor-pointer relative ${
                      isSelected ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border bg-card"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <p className="font-body text-[13px] font-bold text-foreground">{menu.menu_name}</p>
                    {menu.cuisine && <p className="font-body text-[11px] text-copper mt-0.5">{menu.cuisine}</p>}
                    {menu.meals?.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {menu.meals.map((meal: string, i: number) => (
                          <p key={i} className="font-body text-[12px] text-muted-foreground">● {meal}</p>
                        ))}
                      </div>
                    )}
                    {dietaryFiltered.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dietaryFiltered.map((d: string, i: number) => (
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

        <button
          type="button"
          disabled={!selectedMenu}
          onClick={handleBook}
          className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          {selectedMenu ? "Book this cook →" : "Select a menu above"}
        </button>
      </div>
    </div>
  );
};

export default CookProfile;
