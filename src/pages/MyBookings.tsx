import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, LogOut, Calendar, ChefHat, MapPin, Star, X } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  cook_name: string;
  menu_selected: string;
  booking_date: string | null;
  frequency: string | null;
  area: string | null;
  total_aed: number | null;
  status: string | null;
  created_at: string;
  grocery_addon: boolean | null;
  rating: number | null;
  rated_at: string | null;
  session_notes: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const filterTabs = ["All", "Upcoming", "Completed", "Cancelled"];

const MyBookings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/account"); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");
    });
  }, [navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", userId],
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

  const filtered = bookings.filter((b) => {
    if (filter === "All") return true;
    if (filter === "Upcoming") return b.status === "pending" || b.status === "confirmed";
    if (filter === "Completed") return b.status === "completed";
    if (filter === "Cancelled") return b.status === "cancelled";
    return true;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatSessionDate = (b: Booking) => {
    if (!b.booking_date) return "Date to be confirmed";
    const formatted = new Date(b.booking_date).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
    return formatted;
  };

  const getSessionTime = (b: Booking): string | null => {
    try {
      if (!b.session_notes) return null;
      const notes = JSON.parse(b.session_notes);
      if (notes.time_slots && notes.time_slots.length > 0) return notes.time_slots[0];
    } catch {}
    return null;
  };

  const getSessionPriceDisplay = (b: Booking) => {
    const total = b.total_aed || 0;
    const freq = b.frequency;
    if (freq === "once") {
      return { price: `AED ${total}`, label: "single session" };
    }
    if (freq === "twice") {
      return { price: `AED ${Math.round(total / 8)}`, label: "per session · twice a week" };
    }
    if (freq === "three") {
      return { price: `AED ${Math.round(total / 12)}`, label: "per session · 3× a week" };
    }
    if (freq === "weekly") {
      return { price: `AED ${Math.round(total / 4)}`, label: "per session · once a week" };
    }
    return { price: `AED ${total}`, label: "" };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <img src={cooqLogo} alt="Cooq" className="h-7" />
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </nav>

      <div className="px-6 pb-6">
        <h1 className="font-display italic text-2xl text-foreground mb-1">My Bookings</h1>
        <p className="font-body text-sm text-muted-foreground mb-4" style={{ display: "none" }}>{userEmail}</p>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full font-body text-xs transition-colors ${filter === tab ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-32" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
            {filtered.map((b) => {
              const priceDisplay = getSessionPriceDisplay(b);
              const sessionTime = getSessionTime(b);
              return (
                <div key={b.id} className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display text-base text-foreground">{b.cook_name}</p>
                      <p className="font-body text-xs text-muted-foreground">{b.menu_selected}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-body text-xs font-medium capitalize ${statusColors[b.status || "pending"] || statusColors.pending}`}>
                      {b.status || "pending"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatSessionDate(b)}</span>
                    </div>
                    {sessionTime && (
                      <div className="flex items-center gap-2 font-body text-sm text-muted-foreground pl-5">
                        <span>{sessionTime}</span>
                      </div>
                    )}
                    {b.area && (
                      <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{b.area}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-body text-xs text-muted-foreground">Booked {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <div className="text-right">
                      <span className="font-display text-base font-bold text-copper">{priceDisplay.price}</span>
                      {priceDisplay.label && (
                        <p className="font-body text-[10px] text-muted-foreground mt-0.5">{priceDisplay.label}</p>
                      )}
                    </div>
                  </div>

                  {(b.status === "pending" || b.status === "confirmed") && (
                    <a href={`mailto:hello@cooq.ae?subject=Reschedule request - ${b.id}`}
                      className="mt-3 w-full py-2.5 rounded-lg border border-copper text-copper font-body text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-copper/5 transition-colors">
                      Reschedule →
                    </a>
                  )}

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
    </div>
  );
};

export default MyBookings;
