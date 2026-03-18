import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { DollarSign } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO } from "date-fns";

interface CompletedBooking {
  id: string;
  booking_date: string | null;
  area: string | null;
  total_aed: number | null;
  paid: boolean | null;
}

const CookEarnings = () => {
  const { cook } = useCook();
  const [totalPaid, setTotalPaid] = useState(0);
  const [pendingRelease, setPendingRelease] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [history, setHistory] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cook) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_date, area, total_aed, paid")
        .eq("cook_id", cook.id)
        .eq("status", "completed")
        .order("booking_date", { ascending: false });

      const list = (data ?? []) as CompletedBooking[];
      setHistory(list);
      setSessionsDone(list.length);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      let paid = 0, pending = 0, month = 0;
      list.forEach((b) => {
        const share = Math.round((b.total_aed ?? 0) * 0.75);
        if (b.paid) {
          paid += share;
          if (b.booking_date && b.booking_date >= monthStart) month += share;
        } else {
          pending += share;
        }
      });

      setTotalPaid(paid);
      setPendingRelease(pending);
      setThisMonth(month);
      setLoading(false);
    };
    fetch();
  }, [cook]);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return format(parseISO(d), "d MMM");
    } catch {
      return d;
    }
  };

  const stats = [
    { label: "Total Paid Out", value: `AED ${totalPaid}`, color: "#86A383" },
    { label: "Pending Release", value: `AED ${pendingRelease}`, color: "#B57E5D" },
    { label: "This Month", value: `AED ${thisMonth}`, color: "#86A383" },
    { label: "Sessions Done", value: String(sessionsDone), color: "#86A383" },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6" style={{ backgroundColor: "#2D312E" }}>
      <h1 className="font-display mb-6" style={{ fontSize: "22px", color: "#F9F7F2" }}>
        My Earnings
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(249,247,242,0.05)", border: "1px solid rgba(134,163,131,0.18)" }}
          >
            <p className="font-display" style={{ fontSize: "22px", color: s.color }}>
              {loading ? "—" : s.value}
            </p>
            <p
              className="uppercase tracking-wider mt-1"
              style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(249,247,242,0.5)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.25)" }}
      >
        <p className="font-body" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
          Cooq takes 25% per session during Phase 1. You keep 75%. Payment releases within 24 hours after proof photos are approved by our team.
        </p>
      </div>

      {/* Session history */}
      <p
        className="uppercase tracking-wider mb-3"
        style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
      >
        Session History
      </p>

      {history.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <DollarSign className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
          <p className="font-body" style={{ fontSize: "13px", color: "rgba(249,247,242,0.5)" }}>
            No completed sessions yet.
          </p>
        </div>
      ) : (
        history.map((b) => {
          const share = Math.round((b.total_aed ?? 0) * 0.75);
          return (
            <div
              key={b.id}
              className="flex justify-between py-4"
              style={{ borderBottom: "1px solid rgba(249,247,242,0.06)" }}
            >
              <div>
                <p className="font-body font-bold" style={{ fontSize: "13px", color: "#F9F7F2" }}>
                  {formatDate(b.booking_date)}
                </p>
                <p className="font-body" style={{ fontSize: "11px", color: "rgba(249,247,242,0.5)" }}>
                  {b.area || "—"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-body font-semibold"
                  style={{ fontSize: "14px", color: b.paid ? "#86A383" : "#B57E5D" }}
                >
                  AED {share}
                </p>
                <p className="font-body" style={{ fontSize: "9px", color: "rgba(249,247,242,0.4)" }}>
                  {b.paid ? "Paid ✓" : "Pending"}
                </p>
              </div>
            </div>
          );
        })
      )}

      <CookBottomNav />
    </div>
  );
};

export default CookEarnings;
