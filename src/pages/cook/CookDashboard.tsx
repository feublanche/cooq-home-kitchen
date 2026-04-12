import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { Bell, ChevronRight, MapPin, Calendar, Clock, UtensilsCrossed, FileText, User } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO } from "date-fns";

interface BookingSummary {
  id: string;
  customer_name: string;
  area: string | null;
  booking_date: string | null;
  menu_selected: string;
  status: string | null;
}

const CookDashboard = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<BookingSummary[]>([]);
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, earned: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!cook) return;

    const [upcomingRes, completedRes, paidRes, pendingRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, customer_name, area, booking_date, menu_selected, status")
        .eq("cook_id", cook.id)
        .eq("status", "confirmed")
        .order("booking_date", { ascending: true })
        .limit(3),
      supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("cook_id", cook.id)
        .eq("status", "completed"),
      supabase
        .from("bookings")
        .select("total_aed")
        .eq("cook_id", cook.id)
        .eq("status", "completed")
        .eq("paid", true),
      supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("cook_id", cook.id)
        .eq("status", "pending"),
    ]);

    const upcomingCount = upcomingRes.data?.length ?? 0;
    const completedCount = completedRes.count ?? 0;
    const earnedTotal = (paidRes.data ?? []).reduce(
      (s, b) => s + Math.round((b.total_aed ?? 0) * 0.75),
      0
    );
    const pending = pendingRes.count ?? 0;

    setStats({ upcoming: upcomingCount, completed: completedCount, earned: earnedTotal });
    setUpcoming((upcomingRes.data as BookingSummary[]) ?? []);
    setPendingCount(pending);
    setLoading(false);
  }, [cook]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!cook) return;
    const ch = supabase
      .channel("cook-dash-" + cook.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: "cook_id=eq." + cook.id,
        },
        () => {
          fetchData();
          toast({ title: "New booking received!", description: "Tap Orders to view." });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [cook, fetchData]);

  const firstName = cook?.name?.split(" ")[0] || "Cooq";
  const initials = cook?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return format(parseISO(d), "EEE d MMM");
    } catch {
      return d;
    }
  };

  // Status banner
  const statusBanner = () => {
    if (!cook) return null;
    const s = cook.status;
    if (s === "applied" || s === "pending" || s === "reviewed") {
      return (
        <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(181,126,93,0.15)", border: "1px solid rgba(181,126,93,0.3)" }}>
          <p className="font-body text-sm" style={{ color: "#B57E5D" }}>
            ⏳ Your profile is under review. We'll be in touch within 48 hours.
          </p>
        </div>
      );
    }
    if (s === "approved" || s === "active") {
      return (
        <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(134,163,131,0.15)", border: "1px solid rgba(134,163,131,0.3)" }}>
          <p className="font-body text-sm" style={{ color: "#86A383" }}>
            ✓ You're live on Cooq!
          </p>
        </div>
      );
    }
    if (s === "suspended" || s === "rejected") {
      return (
        <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="font-body text-sm" style={{ color: "#ef4444" }}>
            Your account is paused. Contact{" "}
            <a href="mailto:hello@cooq.ae" className="underline">support</a>.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#2D312E" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "#2D312E", borderBottom: "1px solid rgba(134,163,131,0.15)" }}
      >
        <img src={cooqLogo} alt="Cooq" className="h-7 brightness-0 invert" />
        <div className="flex items-center gap-3">
          {cook?.photo_url ? (
            <img src={cook.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(134,163,131,0.2)" }}>
              <span className="font-body text-xs font-bold" style={{ color: "#86A383" }}>{initials}</span>
            </div>
          )}
          <span className="font-body" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Hi, {firstName}
          </span>
          <button className="relative" onClick={() => navigate("/cook/orders")}>
            <Bell className="w-5 h-5" style={{ color: "rgba(249,247,242,0.6)" }} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusBanner()}

      {/* Stats */}
      <div className="mt-4 px-4 flex gap-3 overflow-x-auto pb-2">
        {[
          { label: "Upcoming", value: stats.upcoming },
          { label: "Completed", value: stats.completed },
          { label: "Earned", value: `AED ${stats.earned}` },
        ].map((s) => (
          <div
            key={s.label}
            className="min-w-[110px] flex-shrink-0 rounded-xl p-4 text-center"
            style={{
              backgroundColor: "rgba(249,247,242,0.05)",
              border: "1px solid rgba(134,163,131,0.18)",
            }}
          >
            <p className="font-display" style={{ fontSize: "28px", color: "#86A383" }}>
              {loading ? "—" : s.value}
            </p>
            <p
              className="mt-1 uppercase tracking-wider"
              style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(249,247,242,0.5)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* New order alert */}
      {pendingCount > 0 && (
        <div
          className="mx-4 mt-3 rounded-xl p-3 flex justify-between items-center cursor-pointer"
          style={{ backgroundColor: "#B57E5D" }}
          onClick={() => navigate("/cook/orders")}
        >
          <span className="font-body font-bold" style={{ fontSize: "13px", color: "#F9F7F2" }}>
            🔔 {pendingCount} new order{pendingCount > 1 ? "s" : ""} — tap to view
          </span>
          <ChevronRight className="w-5 h-5" style={{ color: "#F9F7F2" }} />
        </div>
      )}

      {/* Quick links */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {[
          { icon: ClipboardList, label: "My Orders", path: "/cook/orders" },
          { icon: UtensilsCrossed, label: "My Menus", path: "/cook/menus" },
          { icon: User, label: "My Profile", path: "/cook/profile" },
          { icon: FileText, label: "Documents", path: "/cook/documents" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              className="flex items-center gap-2 rounded-xl py-3 px-4 font-body font-semibold"
              style={{
                fontSize: "13px",
                backgroundColor: "rgba(249,247,242,0.05)",
                border: "1px solid rgba(134,163,131,0.18)",
                color: "#F9F7F2",
              }}
              onClick={() => navigate(link.path)}
            >
              <Icon className="w-4 h-4" style={{ color: "#86A383" }} />
              {link.label}
            </button>
          );
        })}
      </div>

      {/* Upcoming sessions */}
      <div className="mt-6 px-4">
        <p
          className="uppercase tracking-wider mb-3"
          style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
        >
          Upcoming Sessions
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{ backgroundColor: "rgba(249,247,242,0.05)", height: "80px" }}
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Clock className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body" style={{ fontSize: "13px", color: "rgba(249,247,242,0.5)" }}>
              No upcoming sessions yet.
            </p>
          </div>
        ) : (
          upcoming.map((b) => (
            <div
              key={b.id}
              className="rounded-xl p-4 mb-2 cursor-pointer"
              style={{
                backgroundColor: "rgba(249,247,242,0.05)",
                border: "1px solid rgba(134,163,131,0.18)",
              }}
              onClick={() => navigate("/cook/orders")}
            >
              <div className="flex justify-between items-center">
                <span className="font-body font-bold" style={{ fontSize: "14px", color: "#F9F7F2" }}>
                  {b.customer_name?.split(" ")[0]}
                </span>
                <span
                  className="font-body rounded-full px-2 py-0.5"
                  style={{
                    fontSize: "9px",
                    backgroundColor: "rgba(134,163,131,0.2)",
                    color: "#86A383",
                  }}
                >
                  Confirmed
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span className="font-body" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
                    {b.area || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "'DM Mono', monospace",
                      color: "#86A383",
                    }}
                  >
                    {formatDate(b.booking_date)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span
                  className="font-body italic truncate max-w-[200px]"
                  style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}
                >
                  {b.menu_selected}
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: "rgba(249,247,242,0.3)" }} />
              </div>
            </div>
          ))
        )}
      </div>

      <CookBottomNav pendingCount={pendingCount} />
    </div>
  );
};

export default CookDashboard;
