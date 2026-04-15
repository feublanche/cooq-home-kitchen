import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ChevronRight, MapPin, Calendar, Clock, LogOut, Loader2, Bell } from "lucide-react";
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
  total_aed: number | null;
  proof_status: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const CookDashboard = () => {
  const { cook, setCook, loading: cookLoading } = useCook();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<BookingSummary[]>([]);
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, earned: 0, monthlyEarnings: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isApproved = cook?.status === "approved" || cook?.status === "active";
  const isPending = cook?.status === "pending" || cook?.status === "applied" || cook?.status === "reviewed";
  const isNeedsReview = cook?.status === "needs_review";
  const isSuspended = cook?.status === "suspended" || cook?.status === "rejected";

  const fetchNotifications = useCallback(async () => {
    if (!cook) return;
    const { data } = await supabase
      .from("cook_notifications")
      .select("*")
      .eq("cook_id", cook.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data ?? []) as Notification[]);
  }, [cook]);

  const markAsRead = async (id: string) => {
    await supabase.from("cook_notifications").update({ read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchData = useCallback(async () => {
    if (!cook || (!isApproved && !isNeedsReview)) { setLoading(false); return; }

    const [upcomingRes, completedRes, paidRes, pendingRes, monthlyRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, customer_name, area, booking_date, menu_selected, status, total_aed, proof_status")
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
      supabase
        .from("bookings")
        .select("total_aed, proof_status")
        .eq("cook_id", cook.id)
        .eq("proof_status", "approved")
        .gte("booking_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]),
    ]);

    const completedCount = completedRes.count ?? 0;
    const earningsRate = completedCount >= 10 ? 0.80 : 0.75;
    const monthlyTotal = (monthlyRes.data ?? []).reduce((s: number, b: any) => s + Math.round((b.total_aed ?? 0) * earningsRate), 0);

    setStats({
      upcoming: upcomingRes.data?.length ?? 0,
      completed: completedCount,
      earned: (paidRes.data ?? []).reduce((s, b) => s + Math.round((b.total_aed ?? 0) * earningsRate), 0),
      monthlyEarnings: monthlyTotal,
    });
    setUpcoming((upcomingRes.data as BookingSummary[]) ?? []);
    setPendingCount(pendingRes.count ?? 0);
    setLoading(false);
  }, [cook, isApproved, isNeedsReview]);

  useEffect(() => { fetchData(); fetchNotifications(); }, [fetchData, fetchNotifications]);

  // Realtime for new bookings
  useEffect(() => {
    if (!cook || !isApproved) return;
    const ch = supabase
      .channel("cook-dash-" + cook.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings", filter: "cook_id=eq." + cook.id }, () => {
        fetchData();
        fetchNotifications();
        toast({ title: "New booking received!", description: "Tap Orders to view." });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cook, fetchData, fetchNotifications, isApproved]);

  // Realtime for notifications
  useEffect(() => {
    if (!cook) return;
    const ch = supabase
      .channel("cook-notif-" + cook.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cook_notifications", filter: "cook_id=eq." + cook.id }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cook, fetchNotifications]);

  const firstName = cook?.name?.split(" ")[0] || "Cook";
  const initials = cook?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "EEE d MMM"); } catch { return d; }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/cook/login", { replace: true });
  };

  const handleEditProfile = () => {
    navigate("/cook/profile");
  };

  // Loading state — max 2s spinner
  useEffect(() => {
    if (cookLoading) {
      const timeout = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [cookLoading]);

  if (cookLoading && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9F6" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  const headerBar = (
    <div className="flex items-center justify-between px-4 py-3 mb-2">
      <img src={cooqLogo} alt="Cooq" className="h-7" />
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="w-5 h-5" style={{ color: "#2C3B3A" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-body" style={{ fontSize: "9px", backgroundColor: "#ef4444", padding: "0 4px" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-8 w-72 max-h-80 overflow-y-auto rounded-xl shadow-lg border border-gray-100 z-50" style={{ backgroundColor: "#fff" }}>
              <div className="p-3 border-b border-gray-100">
                <p className="font-body font-semibold text-sm" style={{ color: "#2C3B3A" }}>Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 font-body text-xs text-center" style={{ color: "#999" }}>No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className="w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: n.read ? "transparent" : "rgba(134,163,131,0.05)" }}
                  >
                    <p className="font-body font-semibold" style={{ fontSize: "12px", color: "#2C3B3A" }}>{n.title}</p>
                    <p className="font-body mt-0.5" style={{ fontSize: "11px", color: "#666" }}>{n.message}</p>
                    <p className="font-body mt-0.5" style={{ fontSize: "9px", color: "#999" }}>
                      {formatDate(n.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button onClick={handleSignOut} className="flex items-center gap-1 font-body text-xs" style={{ color: "#999" }}>
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  // Pending state
  if (isPending) {
    return (
      <div className="min-h-screen px-4 py-6" style={{ backgroundColor: "#FAF9F6" }}>
        {headerBar}
        <h2 className="font-display italic text-xl mb-4" style={{ color: "#2C3B3A" }}>Hi {firstName} 👋</h2>
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="font-body text-sm" style={{ color: "#D97706" }}>
            ⏳ Your application is under review. We'll be in touch within 48 hours.
          </p>
        </div>
        <div className="rounded-xl p-4 bg-white border border-gray-100">
          <p className="font-body text-sm mb-3" style={{ color: "#666" }}>
            Your application and documents are under review. We'll be in touch within 48 hours.
          </p>
          <button
            onClick={() => navigate("/cook/documents")}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm"
            style={{ backgroundColor: "rgba(134,163,131,0.1)", color: "#86A383" }}
          >
            View documents
          </button>
        </div>
        <CookBottomNav />
      </div>
    );
  }

  // Needs review state
  if (isNeedsReview) {
    return (
      <div className="min-h-screen pb-24 px-4 py-6" style={{ backgroundColor: "#FAF9F6" }}>
        {headerBar}
        <h2 className="font-display italic text-xl mb-4" style={{ color: "#2C3B3A" }}>Hi {firstName} 👋</h2>
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="font-body text-sm font-semibold mb-1" style={{ color: "#D97706" }}>⚠️ Profile update needed</p>
          <p className="font-body text-sm" style={{ color: "#92400E" }}>{cook?.operator_notes || "Please update your profile."}</p>
          <button
            onClick={handleEditProfile}
            className="mt-3 px-4 py-2 rounded-lg font-body font-semibold text-sm"
            style={{ backgroundColor: "#D97706", color: "#fff" }}
          >
            Edit Profile
          </button>
        </div>
        <CookBottomNav />
      </div>
    );
  }

  // Suspended state
  if (isSuspended) {
    return (
      <div className="min-h-screen px-4 py-6" style={{ backgroundColor: "#FAF9F6" }}>
        {headerBar}
        <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-body text-sm text-red-600">
            Your account is paused. Contact{" "}
            <a href="mailto:admin.cooq@gmail.com" className="underline">admin.cooq@gmail.com</a>.
          </p>
        </div>
      </div>
    );
  }

  // Approved state
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAF9F6" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "#FAF9F6", borderColor: "rgba(0,0,0,0.06)" }}>
        <img src={cooqLogo} alt="Cooq" className="h-7" />
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-5 h-5" style={{ color: "#2C3B3A" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-body" style={{ fontSize: "9px", backgroundColor: "#ef4444", padding: "0 4px" }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-8 w-72 max-h-80 overflow-y-auto rounded-xl shadow-lg border border-gray-100 z-50" style={{ backgroundColor: "#fff" }}>
                <div className="p-3 border-b border-gray-100">
                  <p className="font-body font-semibold text-sm" style={{ color: "#2C3B3A" }}>Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 font-body text-xs text-center" style={{ color: "#999" }}>No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className="w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: n.read ? "transparent" : "rgba(134,163,131,0.05)" }}
                    >
                      <p className="font-body font-semibold" style={{ fontSize: "12px", color: "#2C3B3A" }}>{n.title}</p>
                      <p className="font-body mt-0.5" style={{ fontSize: "11px", color: "#666" }}>{n.message}</p>
                      <p className="font-body mt-0.5" style={{ fontSize: "9px", color: "#999" }}>
                        {formatDate(n.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {cook?.photo_url ? (
            <img src={cook.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(134,163,131,0.15)" }}>
              <span className="font-body text-xs font-bold" style={{ color: "#86A383" }}>{initials}</span>
            </div>
          )}
          <span className="font-body text-xs" style={{ color: "#666" }}>Hi, {firstName}</span>
          <button onClick={handleSignOut} className="font-body text-xs" style={{ color: "#999" }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(134,163,131,0.1)", border: "1px solid rgba(134,163,131,0.2)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm" style={{ color: "#86A383" }}>✓ You're live on Cooq!</p>
            <p className="font-body mt-1" style={{ fontSize: "11px", color: "#666" }}>
              Need to update your profile or photo? Edit and resubmit for review.
            </p>
          </div>
          <button
            onClick={handleEditProfile}
            className="shrink-0 rounded-lg px-3 py-2 font-body font-semibold text-xs"
            style={{ backgroundColor: "#86A383", color: "#FAF9F6" }}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 px-4 flex gap-3 overflow-x-auto pb-2">
        {[
          { label: "Upcoming", value: stats.upcoming },
          { label: "Completed", value: stats.completed },
          { label: "Earned", value: `AED ${stats.earned}` },
        ].map((s) => (
          <div key={s.label} className="min-w-[110px] flex-shrink-0 rounded-xl p-4 text-center bg-white border border-gray-100">
            <p className="font-display" style={{ fontSize: "28px", color: "#86A383" }}>
              {loading ? "—" : s.value}
            </p>
            <p className="mt-1 uppercase tracking-wider" style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "#999" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly earnings */}
      <div className="mx-4 mt-3 rounded-xl p-3" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.15)" }}>
        <p className="font-body font-semibold" style={{ fontSize: "14px", color: "#86A383" }}>
          This month's earnings: AED {loading ? "—" : stats.monthlyEarnings}
        </p>
        <p className="font-body mt-1" style={{ fontSize: "10px", color: "#999" }}>
          Cooq processes cook payments monthly.
        </p>
      </div>

      {/* New order alert */}
      {pendingCount > 0 && (
        <div className="mx-4 mt-3 rounded-xl p-3 flex justify-between items-center cursor-pointer" style={{ backgroundColor: "#B87355" }} onClick={() => navigate("/cook/orders")}>
          <span className="font-body font-bold" style={{ fontSize: "13px", color: "#FAF9F6" }}>
            🔔 {pendingCount} new order{pendingCount > 1 ? "s" : ""} — tap to view
          </span>
          <ChevronRight className="w-5 h-5" style={{ color: "#FAF9F6" }} />
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="mt-6 px-4">
        <p className="uppercase tracking-wider mb-3" style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B87355" }}>
          Upcoming Sessions
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse bg-white border border-gray-100" style={{ height: "80px" }} />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Clock className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body" style={{ fontSize: "13px", color: "#999" }}>No upcoming sessions yet.</p>
          </div>
        ) : (
          upcoming.map((b) => (
            <div key={b.id} className="rounded-xl p-4 mb-2 cursor-pointer bg-white border border-gray-100" onClick={() => navigate("/cook/orders")}>
              <div className="flex justify-between items-center">
                <span className="font-body font-bold" style={{ fontSize: "14px", color: "#2C3B3A" }}>{b.customer_name?.split(" ")[0]}</span>
                <span className="font-body rounded-full px-2 py-0.5" style={{ fontSize: "9px", backgroundColor: "rgba(134,163,131,0.15)", color: "#86A383" }}>Confirmed</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span className="font-body" style={{ fontSize: "12px", color: "#999" }}>{b.area || "—"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" style={{ color: "#86A383" }} />
                  <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>{formatDate(b.booking_date)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="font-body italic truncate max-w-[200px]" style={{ fontSize: "12px", color: "#999" }}>{b.menu_selected}</span>
                <ChevronRight className="w-4 h-4" style={{ color: "#ccc" }} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="onesignal-customlink-container mx-4 mt-4 mb-4"></div>

      <CookBottomNav pendingCount={pendingCount} />
    </div>
  );
};

export default CookDashboard;
