import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  const { data: cook, isLoading } = useQuery({
    queryKey: ["cook", id],
    queryFn: async () => {
      const { data } = await supabase.from("cooks").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: menus = [] } = useQuery({
    queryKey: ["cook-menus", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cook_menus")
        .select("*")
        .eq("cook_id", id!)
        .eq("status", "approved");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["cook-avail", id],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("cook_availability")
          .select("*")
          .eq("cook_id", id!)
          .eq("available", true);
        return data || [];
      } catch {
        return [];
      }
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
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/book", {
        state: {
          cookId: cook.id,
          cookInitials: initials,
          cookArea: cook.area,
          selectedMenuId: selectedMenu.id,
          selectedMenuName: selectedMenu.menu_name,
          selectedMeals: selectedMenu.meals,
        },
      });
    } else {
      navigate("/account", { state: { returnTo: "/cook/" + id } });
    }
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
          {cook.photo_url ? (
            <img
              src={cook.photo_url}
              alt=""
              className="w-24 h-24 rounded-full object-cover mb-4"
              style={{ filter: "blur(12px)" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#B57E5D", filter: "blur(12px)" }}
            >
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

        {/* Availability */}
        {availability.length > 0 && (
          <div className="mb-6">
            <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Availability</p>
            <div className="flex flex-wrap gap-2">
              {availability.map((a: any) => (
                <span
                  key={a.id}
                  className="px-3 py-1.5 rounded-full bg-[#86A383]/10 text-[#86A383] font-body text-xs font-medium"
                >
                  {dayNames[a.day_of_week] || `Day ${a.day_of_week}`}
                </span>
              ))}
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
                    {menu.cuisine && (
                      <p className="font-body text-[11px] text-copper mt-0.5">{menu.cuisine}</p>
                    )}
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
                    <p className="font-body text-sm font-semibold text-copper mt-2">AED {menu.price_aed}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Book CTA */}
        <button
          type="button"
          disabled={!selectedMenu}
          onClick={handleBook}
          className="w-full py-4 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-base disabled:opacity-40 transition-opacity"
        >
          {selectedMenu ? "Book this cook →" : "Select a menu above to continue"}
        </button>
      </div>
    </div>
  );
};

export default CookProfile;
