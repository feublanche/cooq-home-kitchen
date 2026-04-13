import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { Bell, ChevronRight, MapPin, Calendar, Clock, UtensilsCrossed, FileText, User, ClipboardList, LogOut } from "lucide-react";
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
  const [menuNotification, setMenuNotification] = useState<string | null>(null);

  const isApproved = cook?.status === "approved" || cook?.status === "active";
  const isPending = cook?.status === "pending" || cook?.status === "applied" || cook?.status === "reviewed";
  const isSuspended = cook?.status === "suspended" || cook?.status === "rejected";

  const fetchData = useCallback(async () => {
    if (!cook || !isApproved) { setLoading(false); return; }

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

    setStats({
      upcoming: upcomingRes.data?.length ?? 0,
      completed: completedRes.count ?? 0,
      earned: (paidRes.data ?? []).reduce((s, b) => s + Math.round((b.total_aed ?? 0) * 0.75), 0),
    });
    setUpcoming((upcomingRes.data as BookingSummary[]) ?? []);
    setPendingCount(pendingRes.count ?? 0);
    setLoading(false);
  }, [cook, isApproved]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime for new bookings
  useEffect(() => {
    if (!cook || !isApproved) return;
    const ch = supabase
      .channel("cook-dash-" + cook.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings", filter: "cook_id=eq." + cook.id }, () => {
        fetchData();
        toast({ title: "New booking received!", description: "Tap Orders to view." });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cook, fetchData, isApproved]);

  // Listen for menu approval/rejection notifications
  useEffect(() => {
    if (!cook || !isApproved) return;
    const ch = supabase
      .channel("cook-menus-" + cook.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cook_menus", filter: "cook_id=eq." + cook.id }, (payload) => {
        const newRow = payload.new as any;
        if (newRow.status === "approved") {
          setMenuNotification(`Your menu "${newRow.menu_name}" has been approved ✓`);
        } else if (newRow.status === "rejected") {
          setMenuNotification(`Your menu "${newRow.menu_name}" was not approved. See feedback in Menus.`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cook, isApproved]);

  const firstName = cook?.name?.split(" ")[0] || "Cooq";
  const initials = cook?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "EEE d MMM"); } catch { return d; }
  };

  // Pending state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <img src={cooqLogo} alt="Cooq" className="h-7" />
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/cook/login", { replace: true }); }}
            className="flex items-center gap-1 font-body text-xs text-muted-foreground"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: "rgba(181,126,93,0.1)", border: "1px solid rgba(181,126,93,0.25)" }}>
          <p className="font-body text-sm" style={{ color: "#B57E5D" }}>
            ⏳ Your application is under review. We'll WhatsApp you within 48 hours.
          </p>
        </div>
        <div className="rounded-xl p-4 bg-card border border-gray-100">
          <p className="font-body text-sm font-semibold text-foreground mb-2">{cook?.name}</p>
          <p className="font-body text-xs text-muted-foreground">{cook?.email}</p>
          {cook?.phone && <p className="font-body text-xs text-muted-foreground">+971 {cook.phone}</p>}
          {cook?.cuisine && cook.cuisine.length > 0 && (
            <p className="font-body text-xs text-muted-foreground mt-2">Cuisines: {cook.cuisine.join(", ")}</p>
          )}
          {cook?.area && <p className="font-body text-xs text-muted-foreground">Areas: {cook.area}</p>}
        </div>
      </div>
    );
  }

  // Suspended state
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <img src={cooqLogo} alt="Cooq" className="h-7" />
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/cook/login", { replace: true }); }}
            className="flex items-center gap-1 font-body text-xs text-muted-foreground"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-body text-sm text-red-600">
            Your account is paused. Contact{" "}
            <a href="mailto:hello@cooq.ae" className="underline">hello@cooq.ae</a>.
          </p>
        </div>
      </div>
    );
  }

  // Approved state
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background border-b border-gray-100">
        <img src={cooqLogo} alt="Cooq" className="h-7" />
        <div className="flex items-center gap-3">
          {cook?.photo_url ? (
            <img src={cook.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(134,163,131,0.15)" }}>
              <span className="font-body text-xs font-bold" style={{ color: "#86A383" }}>{initials}</span>
            </div>
          )}
          <span className="font-body text-xs text-muted-foreground">Hi, {firstName}</span>
          <button className="relative" onClick={() => navigate("/cook/orders")}>
            <Bell className="w-5 h-5 text-muted-foreground" />
            {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(134,163,131,0.1)", border: "1px solid rgba(134,163,131,0.2)" }}>
        <p className="font-body text-sm" style={{ color: "#86A383" }}>✓ You're live on Cooq!</p>
      </div>

      {/* Menu notification banner */}
      {menuNotification && (
        <div className="mx-4 mt-2 rounded-xl p-3 flex justify-between items-center" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.2)" }}>
          <p className="font-body text-xs" style={{ color: "#86A383" }}>{menuNotification}</p>
          <button onClick={() => setMenuNotification(null)} className="font-body text-xs text-muted-foreground ml-2">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 px-4 flex gap-3 overflow-x-auto pb-2">
        {[
          { label: "Upcoming", value: stats.upcoming },
          { label: "Completed", value: stats.completed },
          { label: "Earned", value: `AED ${stats.earned}` },
        ].map((s) => (
          <div key={s.label} className="min-w-[110px] flex-shrink-0 rounded-xl p-4 text-center bg-card border border-gray-100">
            <p className="font-display" style={{ fontSize: "28px", color: "#86A383" }}>
              {loading ? "—" : s.value}
            </p>
            <p className="mt-1 uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* New order alert */}
      {pendingCount > 0 && (
        <div className="mx-4 mt-3 rounded-xl p-3 flex justify-between items-center cursor-pointer" style={{ backgroundColor: "#B57E5D" }} onClick={() => navigate("/cook/orders")}>
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
            <button key={link.path} className="flex items-center gap-2 rounded-xl py-3 px-4 font-body font-semibold text-foreground bg-card border border-gray-100" style={{ fontSize: "13px" }} onClick={() => navigate(link.path)}>
              <Icon className="w-4 h-4" style={{ color: "#86A383" }} />
              {link.label}
            </button>
          );
        })}
      </div>

      {/* Upcoming sessions */}
      <div className="mt-6 px-4">
        <p className="uppercase tracking-wider mb-3" style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}>
          Upcoming Sessions
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse bg-card border border-gray-100" style={{ height: "80px" }} />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Clock className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body text-muted-foreground" style={{ fontSize: "13px" }}>No upcoming sessions yet.</p>
          </div>
        ) : (
          upcoming.map((b) => (
            <div key={b.id} className="rounded-xl p-4 mb-2 cursor-pointer bg-card border border-gray-100" onClick={() => navigate("/cook/orders")}>
              <div className="flex justify-between items-center">
                <span className="font-body font-bold text-foreground" style={{ fontSize: "14px" }}>{b.customer_name?.split(" ")[0]}</span>
                <span className="font-body rounded-full px-2 py-0.5" style={{ fontSize: "9px", backgroundColor: "rgba(134,163,131,0.15)", color: "#86A383" }}>Confirmed</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span className="font-body text-muted-foreground" style={{ fontSize: "12px" }}>{b.area || "—"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>{formatDate(b.booking_date)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="font-body italic truncate max-w-[200px] text-muted-foreground" style={{ fontSize: "12px" }}>{b.menu_selected}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
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
