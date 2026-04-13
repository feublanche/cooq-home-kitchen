import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { ArrowLeft } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO } from "date-fns";

interface Order {
  id: string;
  customer_name: string;
  area: string | null;
  booking_date: string | null;
  menu_selected: string;
  status: string | null;
  tier: string | null;
  total_aed: number | null;
  created_at: string;
}

const CookOrders = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!cook) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_name, area, booking_date, menu_selected, status, tier, total_aed, created_at")
        .eq("cook_id", cook.id)
        .order("booking_date", { ascending: true });

      const list = (data ?? []) as Order[];
      const completed = list.filter((o) => o.status === "completed").length;
      setCompletedCount(completed);

      // Sort: upcoming (confirmed) first, then completed, then cancelled
      const statusOrder: Record<string, number> = { confirmed: 0, pending: 1, completed: 2, cancelled: 3 };
      list.sort((a, b) => (statusOrder[a.status || "pending"] ?? 1) - (statusOrder[b.status || "pending"] ?? 1));

      setOrders(list);
      setLoading(false);
    };
    fetch();
  }, [cook]);

  const earningsRate = completedCount >= 10 ? 0.80 : 0.75;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "EEE d MMM"); } catch { return d; }
  };

  const tierLabel = (t: string | null) => {
    if (t === "family") return "Family";
    if (t === "large") return "Large";
    return "Duo";
  };

  const statusBadge = (s: string | null) => {
    if (s === "confirmed") return { bg: "rgba(134,163,131,0.15)", color: "#86A383", label: "Upcoming" };
    if (s === "completed") return { bg: "rgba(0,0,0,0.05)", color: "#999", label: "Completed" };
    if (s === "cancelled") return { bg: "rgba(239,68,68,0.08)", color: "#ef4444", label: "Cancelled" };
    return { bg: "rgba(181,126,93,0.1)", color: "#B57E5D", label: "Pending" };
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate("/cook/dashboard")}>
          <ArrowLeft className="w-5 h-5" style={{ color: "#2C3B3A" }} />
        </button>
        <h1 className="font-display" style={{ fontSize: "20px", color: "#2C3B3A" }}>My Orders</h1>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl animate-pulse bg-white border border-gray-100" style={{ height: "80px" }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <span style={{ fontSize: "32px" }}>📋</span>
            <p className="font-body font-semibold mt-2" style={{ fontSize: "14px", color: "#2C3B3A" }}>No bookings yet</p>
            <p className="font-body text-center mt-1" style={{ fontSize: "12px", color: "#999" }}>
              Your upcoming sessions will appear here once customers book you.
            </p>
          </div>
        ) : (
          orders.map((o) => {
            const badge = statusBadge(o.status);
            const customerFirst = o.customer_name?.split(" ")[0] || "Customer";
            const cookEarnings = Math.round((o.total_aed ?? 350) * earningsRate);

            return (
              <div key={o.id} className="rounded-xl p-4 mb-2 bg-white border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-body font-bold" style={{ fontSize: "14px", color: "#2C3B3A" }}>{customerFirst}</span>
                  <span className="font-body rounded-full px-2.5 py-0.5" style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>{formatDate(o.booking_date)}</span>
                  <span className="font-body" style={{ fontSize: "11px", color: "#999" }}>{tierLabel(o.tier)}</span>
                  <span className="font-body" style={{ fontSize: "11px", color: "#999" }}>{o.area || "—"}</span>
                </div>

                <p className="font-body italic mt-1" style={{ fontSize: "12px", color: "#666" }}>{o.menu_selected}</p>

                <p className="font-body font-semibold mt-2" style={{ fontSize: "12px", color: "#86A383" }}>
                  Your earnings: AED {cookEarnings}
                </p>
              </div>
            );
          })
        )}
      </div>

      <CookBottomNav />
    </div>
  );
};

export default CookOrders;
