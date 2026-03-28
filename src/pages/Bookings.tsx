import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Calendar, Star } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import BottomNav from "@/components/BottomNav";

interface Booking {
  id: string;
  cook_id: string;
  cook_name: string;
  menu_selected: string;
  booking_date: string | null;
  frequency: string | null;
  tier: string | null;
  total_aed: number | null;
  status: string | null;
  created_at: string;
  rating: number | null;
  rated_at: string | null;
  selected_menu_id: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Upcoming", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Upcoming", className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

const TIER_LABELS: Record<string, string> = { duo: "Duo", family: "Family", large: "Large" };

const Bookings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/account"); return; }
      setUserId(user.id);
    });
  }, [navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_user_id", userId!)
        .order("created_at", { ascending: false });
      return (data || []) as Booking[];
    },
    enabled: !!userId,
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n: string) => n[0]).join(".") + ".";

  const isUpcoming = (s: string | null) => s === "pending" || s === "confirmed";

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <nav className="flex items-center px-6 py-4">
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 pb-6">
        <h1 className="font-display italic text-2xl text-foreground mb-4">My Bookings</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-32" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <p className="font-body text-foreground font-medium mb-2">No bookings yet</p>
            <p className="font-body text-sm text-muted-foreground mb-6">Find your cook and your bookings will appear here.</p>
            <button onClick={() => navigate("/search")} className="px-6 py-3 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-sm">
              Find Your Cook →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const st = statusConfig[b.status || "pending"] || statusConfig.pending;
              return (
                <div key={b.id} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display text-base text-foreground">{getInitials(b.cook_name)}</p>
                      <p className="font-body text-xs text-muted-foreground">{b.menu_selected}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-body text-xs font-medium ${st.className}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{b.booking_date ? new Date(b.booking_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBC"}</span>
                    </div>
                    {b.tier && (
                      <p className="font-body text-xs text-muted-foreground">{TIER_LABELS[b.tier] || b.tier}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-display text-base font-bold text-accent">AED {b.total_aed || 0}</span>
                    {isUpcoming(b.status) && (
                      <button onClick={() => navigate("/book", {
                        state: {
                          cookId: b.cook_id,
                          cookInitials: getInitials(b.cook_name),
                          selectedMenuId: b.selected_menu_id,
                          selectedMenuName: b.menu_selected,
                        }
                      })}
                        className="px-4 py-1.5 rounded-full border border-copper text-copper font-body text-xs font-medium hover:bg-copper/5 transition-colors">
                        Reschedule
                      </button>
                    )}
                  </div>

                  {b.status === "completed" && !b.rating && (
                    <button onClick={() => navigate(`/rate/${b.id}`)}
                      className="w-full mt-3 py-2 rounded-lg border border-copper text-copper font-body text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-copper/5 transition-colors">
                      <Star className="w-3.5 h-3.5" /> Rate your session →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Bookings;
