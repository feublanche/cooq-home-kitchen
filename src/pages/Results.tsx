import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, ChefHat, Clock, Star } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { neighborhood, cuisines, dietary, frequency } = (location.state as any) || {};

  const { data: cooks = [], isLoading } = useQuery({
    queryKey: ["cooks", neighborhood, cuisines, dietary],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_cooks");
      return data || [];
    },
  });

  const { data: cookRatings = {} } = useQuery({
    queryKey: ["cook-ratings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("cook_id, rating")
        .not("rating", "is", null);
      const map: Record<string, { sum: number; count: number }> = {};
      (data || []).forEach((b: any) => {
        if (!map[b.cook_id]) map[b.cook_id] = { sum: 0, count: 0 };
        map[b.cook_id].sum += b.rating;
        map[b.cook_id].count += 1;
      });
      return map;
    },
  });

  const getAvgRating = (cookId: string) => {
    const r = (cookRatings as any)[cookId];
    if (!r || r.count === 0) return null;
    return (r.sum / r.count).toFixed(1);
  };

  const filtered = cooks.filter((cook: any) => {
    if (cuisines && cuisines.length > 0) {
      const cookCuisines = (cook.cuisine || []).map((c: string) => c.toLowerCase());
      const match = cuisines.some((c: string) =>
        cookCuisines.some((cc: string) =>
          cc.includes(c.toLowerCase()) || c.toLowerCase().includes(cc)
        )
      );
      if (!match) return false;
    }
    return true;
  });

  const noFilterMatch = cuisines && cuisines.length > 0 && filtered.length === 0;
  const displayCooks = noFilterMatch ? [] : (filtered.length > 0 ? filtered : cooks);

  const getInitials = (name: string) =>
    name.split(" ").map((n: string) => n[0]).join(".") + ".";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center gap-3 px-6 py-4">
        <button onClick={() => navigate("/search")} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 pb-4">
        <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-1">Your Matches</p>
        <h1 className="font-display italic text-2xl text-foreground mb-2">
          {isLoading ? "Finding cooks..." : noFilterMatch ? "No cooks available with this cuisine yet — check back soon." : `${displayCooks.length} cook${displayCooks.length !== 1 ? "s" : ""} match your preferences`}
        </h1>
      </div>

      <div className="flex-1 px-6 pb-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </div>
              <div className="h-10 bg-muted rounded-lg mt-4" />
            </div>
          ))
        ) : noFilterMatch ? (
          <div className="text-center py-12">
            <p className="font-body text-sm text-muted-foreground">
              No cooks available with this cuisine yet — check back soon.
            </p>
            <button onClick={() => navigate("/search")} className="mt-4 px-6 py-3 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-sm">
              ← Update preferences
            </button>
          </div>
        ) : displayCooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-sm text-muted-foreground">
              No cooks available yet. Email{" "}
              <a href="mailto:hello@cooq.ae" className="text-copper underline">hello@cooq.ae</a>{" "}
              to join the waitlist.
            </p>
          </div>
        ) : (
          <>
            {displayCooks.map((cook: any) => {
              const initials = getInitials(cook.name);
              return (
                <div key={cook.id} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex gap-4">
                    {cook.photo_url ? (
                      <img src={cook.photo_url} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" style={{ filter: "blur(12px)" }} />
                    ) : (
                      <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center bg-copper">
                        <span className="font-display text-2xl text-accent-foreground" style={{ filter: "blur(3px)" }}>{initials}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg text-foreground">{initials}</h3>
                        {getAvgRating(cook.id) && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-body text-xs font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {getAvgRating(cook.id)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ChefHat className="w-3.5 h-3.5 text-copper flex-shrink-0" />
                        <p className="font-body text-sm text-foreground font-medium">{cook.cuisine?.join(" · ")}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="font-body text-xs text-muted-foreground">{cook.years_experience} years experience</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {cook.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-body text-xs font-semibold text-primary">
                        <ShieldCheck className="w-4 h-4" />
                        ✦ Cooq Certified
                      </span>
                    )}
                  </div>

                  {cook.health_card && (
                    <p className="font-body text-[10px] text-muted-foreground mt-2 leading-snug">
                      Health Card ✓
                    </p>
                  )}

                  <button
                    onClick={() => navigate(`/cook/${cook.id}`)}
                    className="w-full mt-4 py-3 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    View Profile →
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
