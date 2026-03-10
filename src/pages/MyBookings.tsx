import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, LogOut, Calendar, ChefHat, MapPin } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

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
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserEmail(session.user.email || "");
      
      // Fetch bookings for this user's email
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("email", session.user.email || "")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={cooqLogo} alt="Cooq" className="h-7" />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-muted-foreground font-body text-sm hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </nav>

      <div className="px-6 pb-6">
        <h1 className="font-display italic text-2xl text-foreground mb-1">My Bookings</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">{userEmail}</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-32" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <p className="font-body text-foreground font-medium mb-2">No bookings yet</p>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Book your first cook and your activity will appear here.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="px-6 py-3 rounded-lg bg-copper text-accent-foreground font-body font-semibold text-sm"
            >
              Find Your Cook →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-card rounded-xl p-5 border border-border"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display text-base text-foreground">{b.cook_name}</p>
                    <p className="font-body text-xs text-muted-foreground">{b.menu_selected}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-body text-xs font-medium capitalize ${
                      statusColors[b.status || "pending"] || statusColors.pending
                    }`}
                  >
                    {b.status || "pending"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {b.booking_date && (
                    <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{b.booking_date}</span>
                    </div>
                  )}
                  {b.area && (
                    <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{b.area}</span>
                    </div>
                  )}
                  {b.frequency && (
                    <p className="font-body text-xs text-muted-foreground">{b.frequency}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="font-body text-xs text-muted-foreground">
                    Booked {formatDate(b.created_at)}
                  </span>
                  <span className="font-display text-base font-bold text-copper">
                    AED {b.total_aed || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
