import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";

interface Booking {
  id: string;
  customer_name: string;
  cook_name: string;
  booking_date: string;
  area: string;
  menu_selected: string;
  dietary: string[];
  grocery_addon: boolean;
  total_aed: number;
  status: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-copper/10 text-copper",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const Admin = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_aed || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground px-6 py-4 flex items-center justify-between">
        <img src={cooqLogo} alt="Cooq" className="h-7 brightness-0 invert" />
        <span className="font-body text-xs text-background/70">Admin</span>
      </div>

      <div className="px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Bookings</p>
            <p className="font-display text-2xl text-foreground">{bookings.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
            <p className="font-display text-2xl text-copper">AED {totalRevenue}</p>
          </div>
        </div>

        {loading ? (
          <p className="font-body text-muted-foreground text-center py-8">Loading...</p>
        ) : bookings.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b, i) => (
              <div key={b.id} className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">
                      #{i + 1} · {b.customer_name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {b.cook_name} · {b.area}
                    </p>
                  </div>
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    className={`font-body text-xs font-semibold px-2 py-1 rounded-lg border-0 ${statusColors[b.status] || ""}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="font-body text-xs text-muted-foreground space-y-0.5">
                  <p>Date: {b.booking_date ? new Date(b.booking_date).toLocaleDateString("en-GB") : "—"}</p>
                  <p>Menu: {b.menu_selected}</p>
                  <p>Dietary: {b.dietary?.join(", ") || "None"}</p>
                  <p>Grocery: {b.grocery_addon ? "Yes" : "No"}</p>
                </div>
                <p className="font-body text-sm font-semibold text-copper mt-2">AED {b.total_aed}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
