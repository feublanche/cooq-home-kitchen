import { useEffect, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { toast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  MapPin,
  UtensilsCrossed,
  ClipboardCheck,
  AlertTriangle,
  Camera,
  DollarSign,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Search,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface Booking {
  id: string;
  customer_name: string;
  cook_name: string;
  cook_id: string;
  cook_email: string | null;
  cook_phone: string | null;
  booking_date: string;
  area: string;
  menu_selected: string;
  dietary: string[];
  grocery_addon: boolean;
  total_aed: number;
  status: string;
  menu_status?: string;
  phone: string;
  email: string;
  created_at: string;
  paid: boolean;
  tier?: string;
  frequency?: string;
  party_size?: number;
  address?: string;
  allergies_notes?: string;
  session_type?: string;
  rating?: number;
  rating_note?: string;
  grocery_fee?: number;
  selected_menu_id?: string;
  payment_intent_id?: string;
  proof_status?: string | null;
}

interface QualityPhoto {
  id: string;
  booking_id: string;
  cook_id: string;
  cook_name: string;
  photo_type: string;
  photo_url: string;
  uploaded_at: string;
  reviewed: boolean;
  approved: boolean | null;
}

interface CookRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cuisine: string[] | null;
  area: string | null;
  years_experience: number | null;
  health_card: boolean | null;
  visa_type: string | null;
  status: string | null;
  created_at: string | null;
  bio?: string | null;
  operator_notes?: string | null;
}

interface MenuRecord {
  id: string;
  cook_id: string | null;
  cook_name: string;
  menu_name: string;
  cuisine: string | null;
  meals: string[] | null;
  dietary: string[] | null;
  price_aed: number;
  serves: number | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

const tabs = [
  { id: "supply", label: "Supply Manager", icon: ShieldCheck },
  { id: "marketplace", label: "Marketplace", icon: MapPin },
  { id: "vetting", label: "Menu Vetting", icon: UtensilsCrossed },
  { id: "quality", label: "Quality Audit", icon: ClipboardCheck },
  { id: "triage", label: "Triage Support", icon: AlertTriangle },
  { id: "proof", label: "Proof of Quality", icon: Camera },
  { id: "finance", label: "Financial", icon: DollarSign },
] as const;

type TabId = (typeof tabs)[number]["id"];

const statusColors: Record<string, string> = {
  pending: "bg-copper/10 text-copper",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const menuStatusColors: Record<string, string> = {
  pending_review: "bg-copper/10 text-copper",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const cookStatusColors: Record<string, string> = {
  applied: "bg-copper/10 text-copper",
  pending: "bg-copper/10 text-copper",
  reviewed: "bg-amber-500/10 text-amber-500",
  needs_review: "bg-amber-500/10 text-amber-500",
  approved: "bg-primary/10 text-primary",
  active: "bg-primary/20 text-primary font-bold",
  suspended: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive/50",
};

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("supply");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [photos, setPhotos] = useState<QualityPhoto[]>([]);
  const [cooks, setCooks] = useState<CookRecord[]>([]);
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [expiringCooks, setExpiringCooks] = useState<any[]>([]);

  // Supply Manager state
  const [supplyView, setSupplyView] = useState<"bookings" | "cooks">("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);
  const [availableCooks, setAvailableCooks] = useState<CookRecord[]>([]);
  const [selectedCookId, setSelectedCookId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Cook detail drawer state
  const [selectedCook, setSelectedCook] = useState<CookRecord | null>(null);
  const [requestChangesMode, setRequestChangesMode] = useState(false);
  const [operatorFeedback, setOperatorFeedback] = useState("");

  // Financial state
  const [showPendingPayouts, setShowPendingPayouts] = useState(false);

  // Menu vetting state
  const [rejectMenuId, setRejectMenuId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Cook documents state
  const [cookDocs, setCookDocs] = useState<{ id: string; cook_id: string; document_type: string; file_url: string; status: string }[]>([]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("quality_photos")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (data) setPhotos(data as QualityPhoto[]);
  };

  const fetchCooks = async () => {
    const { data } = await supabase
      .from("cooks")
      .select("id, name, email, phone, cuisine, area, years_experience, health_card, visa_type, status, created_at, bio, operator_notes")
      .order("created_at", { ascending: false });
    if (data) setCooks(data as unknown as CookRecord[]);
  };

  const fetchMenus = async () => {
    const { data } = await supabase
      .from("cook_menus")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMenus(data as MenuRecord[]);
  };

  useEffect(() => {
    fetchBookings();
    fetchPhotos();
    fetchCooks();
    fetchMenus();
    // Fetch DHA expiry alerts
    const fetchExpiring = async () => {
      const { data } = await supabase
        .from("cooks")
        .select("id, name, email, health_card_expiry")
        .in("status", ["active", "approved"])
        .not("health_card_expiry", "is", null);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 30);
      setExpiringCooks((data || []).filter((c: any) => new Date(c.health_card_expiry) <= cutoff));
    };
    fetchExpiring();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  // ── Cook Notification ──
  const notifyCookGeneric = async (cookName: string, cookEmail: string, cookPhone: string | null, eventType: string, details: Record<string, any>) => {
    try {
      await supabase.functions.invoke("notify-cook", {
        body: {
          cook_name: cookName,
          cook_email: cookEmail,
          cook_phone: cookPhone,
          event_type: eventType,
          booking_details: details,
        },
      });
    } catch (err) {
      console.error("Notification failed:", err);
    }
  };

  // ── Assign Cook ──
  const openAssignDrawer = async (booking: Booking) => {
    setAssignBooking(booking);
    setSelectedCookId(null);
    setAssignDrawerOpen(true);
    const { data } = await supabase
      .from("cooks")
      .select("id, name, email, phone, cuisine, area, years_experience, health_card, visa_type, status, created_at")
      .in("status", ["approved", "active"]);
    setAvailableCooks((data ?? []) as CookRecord[]);
  };

  const confirmAssignment = async () => {
    if (!assignBooking || !selectedCookId) return;
    const cook = availableCooks.find((c) => c.id === selectedCookId);
    if (!cook) return;
    setAssigning(true);
    await supabase
      .from("bookings")
      .update({
        cook_id: cook.id,
        cook_name: cook.name,
        cook_email: cook.email,
        cook_phone: cook.phone,
      })
      .eq("id", assignBooking.id);

    await notifyCookGeneric(cook.name, cook.email, cook.phone, "new_booking", {
      menu: assignBooking.menu_selected,
      date: assignBooking.booking_date,
      customer_name: assignBooking.customer_name,
      area: assignBooking.area,
    });

    toast({ title: "Cook assigned and notified ✓" });
    setAssignDrawerOpen(false);
    setAssigning(false);
    fetchBookings();
  };

  // ── Cook Status Update ──
  const updateCookStatus = async (cookId: string, newStatus: string, notes?: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };
    if (notes !== undefined) updateData.operator_notes = notes;
    setCooks((prev) => prev.map((c) => (c.id === cookId ? { ...c, status: newStatus, operator_notes: notes ?? c.operator_notes } : c)));
    await supabase.from("cooks").update(updateData as any).eq("id", cookId);
    toast({ title: `Cook status updated to "${newStatus}" ✓` });
  };

  // ── Cook Drawer Actions ──
  const openCookDrawer = async (cook: CookRecord) => {
    setSelectedCook(cook);
    setRequestChangesMode(false);
    setOperatorFeedback("");
    // Fetch cook documents
    const { data } = await supabase
      .from("cook_documents")
      .select("id, cook_id, document_type, file_url, status")
      .eq("cook_id", cook.id);
    setCookDocs((data ?? []) as any);
  };

  const handleApproveCook = async () => {
    if (!selectedCook) return;
    await updateCookStatus(selectedCook.id, "approved");
    setSelectedCook(null);
  };

  const handleRequestChanges = async () => {
    if (!selectedCook || !operatorFeedback.trim()) return;
    await updateCookStatus(selectedCook.id, "needs_review", operatorFeedback.trim());
    setSelectedCook(null);
    setRequestChangesMode(false);
    setOperatorFeedback("");
  };

  const handleSuspendCook = async () => {
    if (!selectedCook) return;
    await updateCookStatus(selectedCook.id, "suspended");
    setSelectedCook(null);
  };

  // ── Menu Vetting Actions (cook_menus) ──
  const handleMenuApprove = async (menu: MenuRecord) => {
    setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, status: "approved" } : m)));
    await supabase.from("cook_menus").update({ status: "approved" }).eq("id", menu.id);

    // Fetch cook email for notification
    if (menu.cook_id) {
      const cook = cooks.find((c) => c.id === menu.cook_id);
      if (cook) {
        await notifyCookGeneric(cook.name, cook.email, cook.phone, "menu_approved", { menu: menu.menu_name });
      }
    }
    toast({ title: "Menu Approved ✓", description: `${menu.cook_name}'s menu "${menu.menu_name}" approved.` });
  };

  const handleMenuReject = async (menu: MenuRecord) => {
    if (!rejectReason.trim()) return;
    setMenus((prev) =>
      prev.map((m) => (m.id === menu.id ? { ...m, status: "rejected", rejection_reason: rejectReason } : m))
    );
    await supabase
      .from("cook_menus")
      .update({ status: "rejected", rejection_reason: rejectReason })
      .eq("id", menu.id);

    if (menu.cook_id) {
      const cook = cooks.find((c) => c.id === menu.cook_id);
      if (cook) {
        await notifyCookGeneric(cook.name, cook.email, cook.phone, "menu_rejected", { menu: menu.menu_name });
      }
    }
    toast({ title: "Menu Rejected", description: `${menu.cook_name}'s menu rejected.` });
    setRejectMenuId(null);
    setRejectReason("");
  };

  // ── Photo Review ──
  const handlePhotoReview = async (photoId: string, approved: boolean) => {
    await supabase
      .from("quality_photos")
      .update({ reviewed: true, approved } as any)
      .eq("id", photoId);
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, reviewed: true, approved } : p))
    );
    toast({
      title: approved ? "Photo Approved ✓" : "Photo Rejected",
      description: approved ? "Proof of quality verified." : "Photo did not meet standards.",
    });
  };

  // ── Mark as Paid ──
  const markAsPaid = async (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, paid: true } : b)));
    await supabase.from("bookings").update({ paid: true }).eq("id", id);
    toast({ title: "Marked ✓" });
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_aed || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  // Supply search filter
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customer_name?.toLowerCase().includes(q) ||
      b.cook_name?.toLowerCase().includes(q) ||
      b.area?.toLowerCase().includes(q)
    );
  });

  // Financial pending payouts
  const pendingPayouts = bookings.filter((b) => b.status === "completed" && !b.paid);
  const pendingPayoutTotal = pendingPayouts.reduce((s, b) => s + Math.round((b.total_aed || 0) * 0.75), 0);

  // Proof of Quality: group photos by booking_id
  const photosByBooking = photos.reduce<Record<string, QualityPhoto[]>>((acc, p) => {
    if (!acc[p.booking_id]) acc[p.booking_id] = [];
    acc[p.booking_id].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-background">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={cooqLogo} alt="Cooq" className="h-6 brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-background/70 uppercase tracking-wider">Operator Dashboard</span>
          <a href="/cook-agreement" target="_blank" className="text-xs text-gray-400 underline hover:text-gray-600">Cook Agreement</a>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/operator/login"); }}
            className="text-background/70 hover:text-background transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-card border-b border-border overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-3 font-body text-[10px] font-medium transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {/* ── Supply Manager ── */}
        {activeTab === "supply" && (
          <div>
            {/* DHA Health Card Expiry Alerts */}
            {expiringCooks.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="font-body text-sm font-semibold text-amber-800 mb-2">⚠️ DHA Health Cards Expiring Within 30 Days</p>
                {expiringCooks.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(217,169,56,0.15)" }}>
                    <span className="font-body text-xs text-amber-700">{c.name} — expires {c.health_card_expiry}</span>
                    <a href={`mailto:${c.email}`} className="font-body text-xs underline" style={{ color: "#B57E5D" }}>Contact</a>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-display text-xl text-foreground mb-1">Supply Manager</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Review/Approve new Cook applications (Visa/EID check)
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Pending" value={cooks.filter((c) => c.status === "applied" || c.status === "pending").length} />
              <StatCard label="Active Cooks" value={cooks.filter((c) => c.status === "approved" || c.status === "active").length} />
              <StatCard label="Total Cooks" value={cooks.length} />
            </div>
            {(() => {
              const confirmedNoPhoto = bookings.filter(
                (b) => b.status === "confirmed" && !photos.some((p) => p.booking_id === b.id)
              );
              const completedNoPhoto = bookings.filter(
                (b) => b.status === "completed" && !photos.some((p) => p.booking_id === b.id)
              );
              const alerts: { icon: React.ReactNode; text: string }[] = [];
              if (confirmedNoPhoto.length > 0) {
                alerts.push({
                  icon: <AlertTriangle className="w-4 h-4 text-copper" />,
                  text: `${confirmedNoPhoto.length} confirmed booking(s) missing proof photos`,
                });
              }
              if (completedNoPhoto.length > 0) {
                alerts.push({
                  icon: <AlertTriangle className="w-4 h-4 text-copper" />,
                  text: `${completedNoPhoto.length} completed booking(s) with no proof photos uploaded`,
                });
              }
              if (expiringCooks.length > 0) {
                alerts.push({
                  icon: <AlertTriangle className="w-4 h-4 text-copper" />,
                  text: `${expiringCooks.length} cook(s) with DHA health cards expiring within 30 days`,
                });
              }
              return (
                <div className="bg-card rounded-xl p-4 border border-border mb-4" style={{ boxShadow: "var(--shadow-card)" }}>
                  <p className="font-body text-sm font-semibold text-foreground mb-2">Alerts</p>
                  <div className="space-y-2">
                    {alerts.length > 0 ? (
                      alerts.map((a, i) => <AlertItem key={i} icon={a.icon} text={a.text} />)
                    ) : (
                      <AlertItem icon={<CheckCircle2 className="w-4 h-4 text-primary" />} text="No alerts — everything looks good ✓" />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSupplyView("bookings")}
                className={`px-4 py-2 rounded-lg font-body text-xs font-semibold transition-colors ${
                  supplyView === "bookings" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                Bookings
              </button>
              <button
                type="button"
                onClick={() => setSupplyView("cooks")}
                className={`px-4 py-2 rounded-lg font-body text-xs font-semibold transition-colors ${
                  supplyView === "cooks" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                Cooks
              </button>
            </div>

            {supplyView === "bookings" && (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customer, cook, area..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const hasCook = b.cook_name && b.cook_id;
                    const expanded = expandedBookingId === b.id;
                    return (
                      <div key={b.id} className="bg-card rounded-xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                        <button type="button" onClick={() => setExpandedBookingId(expanded ? null : b.id)} className="w-full text-left p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-body text-sm font-semibold text-foreground">{b.customer_name}</p>
                              <p className="font-body text-xs text-muted-foreground">
                                {b.area || "—"} · {b.booking_date || "No date"}
                              </p>
                            </div>
                            <select
                              value={b.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { e.stopPropagation(); updateStatus(b.id, e.target.value); }}
                              className={`font-body text-xs font-semibold px-2 py-1 rounded-lg border-0 ${statusColors[b.status] || ""}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          {hasCook ? (
                            <p className="font-body text-xs text-primary">Cook: {b.cook_name}</p>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-body text-xs text-copper">Unassigned</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); openAssignDrawer(b); }}
                                className="font-body text-[10px] font-semibold px-2 py-1 rounded-lg bg-copper/10 text-copper hover:bg-copper/20 transition-colors"
                              >
                                Assign Cook
                              </button>
                            </div>
                          )}
                        </button>
                        {expanded && (
                          <div className="px-4 pb-4 border-t border-border pt-3 space-y-1.5">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs">
                              <p className="text-muted-foreground">Email</p><p className="text-foreground">{b.email}</p>
                              <p className="text-muted-foreground">Phone</p><p className="text-foreground">{b.phone}</p>
                              <p className="text-muted-foreground">Address</p><p className="text-foreground">{b.address || "—"}</p>
                              <p className="text-muted-foreground">Menu</p><p className="text-foreground">{b.menu_selected}</p>
                              <p className="text-muted-foreground">Tier</p><p className="text-foreground">{b.tier || "—"}</p>
                              <p className="text-muted-foreground">Frequency</p><p className="text-foreground">{b.frequency || "—"}</p>
                              <p className="text-muted-foreground">Party Size</p><p className="text-foreground">{b.party_size || "—"}</p>
                              <p className="text-muted-foreground">Dietary</p><p className="text-foreground">{b.dietary?.join(", ") || "None"}</p>
                              <p className="text-muted-foreground">Allergies</p><p className="text-foreground">{b.allergies_notes || "None"}</p>
                              <p className="text-muted-foreground">Grocery</p><p className="text-foreground">{b.grocery_addon ? `Yes (AED ${b.grocery_fee || 75})` : "No"}</p>
                              <p className="text-muted-foreground">Session Type</p><p className="text-foreground">{b.session_type || "standard"}</p>
                              <p className="text-muted-foreground">Total</p><p className="text-foreground font-semibold text-copper">AED {b.total_aed}</p>
                              <p className="text-muted-foreground">Paid</p><p className="text-foreground">{b.paid ? "Yes ✓" : "No"}</p>
                              <p className="text-muted-foreground">Rating</p><p className="text-foreground">{b.rating ? `${b.rating}/5` : "—"}</p>
                              <p className="text-muted-foreground">Created</p><p className="text-foreground">{new Date(b.created_at).toLocaleDateString("en-GB")}</p>
                            </div>
                            {b.rating_note && <p className="font-body text-xs text-muted-foreground italic mt-1">"{b.rating_note}"</p>}
                            {b.cook_email && <p className="font-body text-xs text-muted-foreground mt-1">Cook: {b.cook_email} · {b.cook_phone || "—"}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <p className="font-body text-sm text-muted-foreground text-center py-8">No bookings found</p>
                  )}
                </div>
              </>
            )}

            {supplyView === "cooks" && (
              <div className="space-y-3">
                {cooks.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => openCookDrawer(c)}
                    className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary/40 transition-colors"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{c.email} · {c.phone || "—"}</p>
                      </div>
                      <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${cookStatusColors[c.status || "applied"] || ""}`}>
                        {c.status || "applied"}
                      </span>
                    </div>
                    <p className="font-body text-xs text-foreground">
                      {c.cuisine?.join(" · ") || "—"} · {c.area || "—"} · {c.years_experience ?? 0}y exp
                    </p>
                  </button>
                ))}
                {cooks.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground text-center py-8">No cooks registered</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Marketplace ── */}
        {activeTab === "marketplace" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Marketplace</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Live tracking of all active sessions in Dubai
            </p>
            <div className="bg-card rounded-xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <MapPin className="w-10 h-10 text-copper mx-auto mb-3" />
              <p className="font-body text-sm font-semibold text-foreground mb-1">Map View</p>
              <p className="font-body text-xs text-muted-foreground">
                Live tracking of all active sessions across Dubai neighborhoods. Coming soon.
              </p>
            </div>
            <div className="mt-4 bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="font-body text-sm font-semibold text-foreground mb-2">Active Sessions Today</p>
              {bookings.filter((b) => b.status === "confirmed").length === 0 ? (
                <p className="font-body text-xs text-muted-foreground">No active sessions</p>
              ) : (
                bookings
                  .filter((b) => b.status === "confirmed")
                  .slice(0, 5)
                  .map((b) => (
                    <div key={b.id} className="flex justify-between py-2 border-b border-border last:border-0 font-body text-sm">
                      <span className="text-foreground">{b.cook_name}</span>
                      <span className="text-muted-foreground">{b.area || "—"}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ── Menu Vetting Queue (reads from cook_menus) ── */}
        {activeTab === "vetting" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Menu Vetting Queue</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Review proposed menus for balance, appeal, and accurate ingredient lists
            </p>
            <div className="space-y-3">
              {menus.map((m) => {
                const ms = m.status || "pending_review";
                return (
                  <div key={m.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{m.cook_name}</p>
                        <p className="font-body text-xs text-foreground">{m.menu_name}</p>
                        <p className="font-body text-xs text-copper mt-0.5">{m.cuisine || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={ms}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (newStatus === "approved") {
                              handleMenuApprove(m);
                            } else if (newStatus === "rejected") {
                              setRejectMenuId(m.id);
                            } else if (newStatus === "pending_review") {
                              setMenus((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "pending_review" } : x)));
                              await supabase.from("cook_menus").update({ status: "pending_review", rejection_reason: null }).eq("id", m.id);
                              toast({ title: "Menu reset to pending" });
                            }
                          }}
                          className={`font-body text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${menuStatusColors[ms] || ""}`}
                        >
                          <option value="pending_review">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Meals */}
                    {m.meals && m.meals.length > 0 && (
                      <div className="mb-2">
                        {m.meals.map((meal, i) => (
                          <p key={i} className="font-body text-xs text-foreground">
                            {i + 1}. {meal}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Dietary pills */}
                    {m.dietary && m.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {m.dietary.map((d) => (
                          <span key={d} className="font-body text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="font-body text-xs text-muted-foreground">
                      AED {m.price_aed} · serves {m.serves || "—"}
                    </p>

                    {ms === "rejected" && m.rejection_reason && (
                      <p className="font-body text-xs text-destructive/70 italic mt-1">{m.rejection_reason}</p>
                    )}

                    {/* Reject reason input */}
                    {rejectMenuId === m.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection..."
                          className="w-full p-2 rounded-lg border border-border bg-card font-body text-xs text-foreground resize-none outline-none focus:border-primary"
                          rows={2}
                        />
                        <button
                          onClick={() => handleMenuReject(m)}
                          disabled={!rejectReason.trim()}
                          className="font-body text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {menus.length === 0 && (
                <p className="font-body text-sm text-muted-foreground text-center py-8">No menus submitted yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Quality Audit ── */}
        {activeTab === "quality" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Quality Audit</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Auto-trigger Stripe transfer 24h after session completion (minus platform commission)
            </p>
            <div className="bg-card rounded-xl p-4 border border-border mb-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="font-body text-sm font-semibold text-foreground mb-2">Session Completion Queue</p>
              <p className="font-body text-xs text-muted-foreground mb-3">
                Receives info about client/phone number to confirm appointment
              </p>
              {bookings
                .filter((b) => b.status === "completed")
                .slice(0, 5)
                .map((b) => (
                  <div key={b.id} className="flex justify-between py-2 border-b border-border last:border-0 font-body text-sm">
                    <span className="text-foreground">{b.cook_name} → {b.customer_name}</span>
                    <span className="text-copper font-semibold">AED {b.total_aed}</span>
                  </div>
                ))}
              {bookings.filter((b) => b.status === "completed").length === 0 && (
                <p className="font-body text-xs text-muted-foreground">No completed sessions yet</p>
              )}
            </div>
          </div>
        )}

        {/* ── Triage Support ── */}
        {activeTab === "triage" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Triage Support</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Handle late check-ins, no-shows, and safety reports
            </p>
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-copper" />
                  <p className="font-body text-sm font-semibold text-foreground">Logistics (Automated)</p>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  Late check-ins trigger auto-SMS/WhatsApp to cook. No-shows trigger auto-rebooking options for client.
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <p className="font-body text-sm font-semibold text-foreground">Quality/Safety (Human)</p>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  Client reports "Cook is unsafe/rude" during the session. This requires immediate human intervention.
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="font-body text-sm font-semibold text-foreground">Re-assignment</p>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  Re-assign sessions for "No-Shows" to backup cooks in the same area.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Proof of Quality (Review Only) ── */}
        {activeTab === "proof" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Proof of Quality</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Review photos uploaded by Cooqs after each session
            </p>

            {Object.keys(photosByBooking).length === 0 ? (
              <div className="bg-card rounded-xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <Camera className="w-10 h-10 text-copper mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No photos uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(photosByBooking).map(([bookingId, bPhotos]) => {
                  const booking = bookings.find((b) => b.id === bookingId);
                  return (
                    <div key={bookingId} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="mb-3">
                        <p className="font-body text-sm font-semibold text-foreground">
                          {bPhotos[0].cook_name}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {booking ? `${booking.customer_name} · ${booking.booking_date || "—"} · ${booking.area || "—"}` : `Booking ${bookingId.slice(0, 8)}...`}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {bPhotos.map((p) => (
                          <div key={p.id} className="relative">
                            <div className="rounded-lg overflow-hidden aspect-square bg-muted">
                              <img src={p.photo_url} alt={p.photo_type} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 px-2 py-1">
                                <p className="font-body text-[10px] text-background capitalize">{p.photo_type}</p>
                              </div>
                            </div>
                            {p.reviewed ? (
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-body font-semibold ${p.approved ? "bg-primary/90 text-background" : "bg-destructive/90 text-background"}`}>
                                {p.approved ? "Approved ✓" : "Rejected"}
                              </div>
                            ) : (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => handlePhotoReview(p.id, true)}
                                  className="flex-1 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePhotoReview(p.id, false)}
                                  className="flex-1 p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Financial Dashboard ── */}
        {activeTab === "finance" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Financial Dashboard</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Escrow management, payout triggers, and revenue tracking
            </p>

            {/* Pending Payouts toggle */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowPendingPayouts(!showPendingPayouts)}
                className={`font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  showPendingPayouts ? "bg-copper/20 text-copper" : "bg-muted text-muted-foreground"
                }`}
              >
                Pending Payouts
              </button>
            </div>

            {showPendingPayouts ? (
              <div>
                <p className="font-body text-sm font-semibold text-copper mb-3">
                  Total pending: AED {pendingPayoutTotal}
                </p>
                <div className="space-y-3">
                  {pendingPayouts.map((b) => (
                    <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-body text-sm font-semibold text-foreground">{b.cook_name}</p>
                          <p className="font-body text-xs text-muted-foreground">{b.customer_name} · {b.booking_date || "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-body text-sm font-semibold text-primary">
                            Cook share: AED {Math.round((b.total_aed || 0) * 0.75)}
                          </p>
                          <button
                            onClick={() => markAsPaid(b.id)}
                            className="font-body text-xs font-semibold px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors mt-1"
                          >
                            Mark as Paid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingPayouts.length === 0 && (
                    <p className="font-body text-sm text-muted-foreground text-center py-8">No pending payouts</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatCard label="Total Revenue" value={`AED ${totalRevenue}`} />
                  <StatCard label="Completed" value={completedCount} />
                  <StatCard label="Pending Payouts" value={pendingPayouts.length} />
                  <StatCard label="Bookings" value={bookings.length} />
                </div>
                <div className="bg-card rounded-xl p-4 border border-border mb-4" style={{ boxShadow: "var(--shadow-card)" }}>
                  <p className="font-body text-sm font-semibold text-foreground mb-2">Escrow Management</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Check customer payments upon booking. Funds held in escrow until proof of quality is verified.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <p className="font-body text-sm font-semibold text-foreground mb-2">Payout Trigger</p>
                  <p className="font-body text-xs text-muted-foreground">
                    Release funds to cook's wallet only after "Proof of Quality" photos are uploaded and 2 hours have passed without a major client complaint.
                  </p>
                </div>
                <div className="mt-4">
                  <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Recent Bookings</p>
                  {loading ? (
                    <p className="font-body text-muted-foreground text-center py-4">Loading...</p>
                  ) : bookings.length === 0 ? (
                    <p className="font-body text-muted-foreground text-center py-4">No bookings yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 10).map((b) => (
                        <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-body text-sm font-semibold text-foreground">{b.customer_name}</p>
                              <p className="font-body text-xs text-muted-foreground">
                                {b.cook_name} · {b.area || "—"}
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
                          <div className="font-body text-xs text-muted-foreground">
                            <p>Menu: {b.menu_selected}</p>
                            <p>Grocery: {b.grocery_addon ? "Yes" : "No"}</p>
                          </div>
                          <p className="font-body text-sm font-semibold text-copper mt-1">AED {b.total_aed}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cook Detail Drawer */}
      <Drawer open={!!selectedCook} onOpenChange={(open) => { if (!open) { setSelectedCook(null); setRequestChangesMode(false); setOperatorFeedback(""); } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">Cook Details</DrawerTitle>
          </DrawerHeader>
          {selectedCook && (
            <div className="px-4 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-body text-base font-semibold text-foreground">{selectedCook.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{selectedCook.email} · {selectedCook.phone || "—"}</p>
                </div>
                <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${cookStatusColors[selectedCook.status || "applied"] || ""}`}>
                  {selectedCook.status || "applied"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs mb-4">
                <p className="text-muted-foreground">Cuisines</p><p className="text-foreground">{selectedCook.cuisine?.join(", ") || "—"}</p>
                <p className="text-muted-foreground">Area</p><p className="text-foreground">{selectedCook.area || "—"}</p>
                <p className="text-muted-foreground">Experience</p><p className="text-foreground">{selectedCook.years_experience ?? 0} years</p>
                <p className="text-muted-foreground">Health Card</p><p className="text-foreground">{selectedCook.health_card ? "Yes ✓" : "No ✗"}</p>
                <p className="text-muted-foreground">Visa</p><p className="text-foreground">{selectedCook.visa_type || "—"}</p>
                <p className="text-muted-foreground">Applied</p><p className="text-foreground">{selectedCook.created_at ? new Date(selectedCook.created_at).toLocaleDateString("en-GB") : "—"}</p>
              </div>
              {selectedCook.bio && (
                <div className="mb-4">
                  <p className="font-body text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="font-body text-xs text-foreground">{selectedCook.bio}</p>
                </div>
              )}
              {selectedCook.operator_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="font-body text-xs font-semibold text-amber-800 mb-1">Operator Notes</p>
                  <p className="font-body text-xs text-amber-700">{selectedCook.operator_notes}</p>
                </div>
              )}

              {requestChangesMode ? (
                <div className="space-y-3">
                  <textarea
                    value={operatorFeedback}
                    onChange={(e) => setOperatorFeedback(e.target.value)}
                    placeholder="Type your feedback for the cook..."
                    className="w-full rounded-xl border border-border bg-card p-3 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRequestChanges}
                      disabled={!operatorFeedback.trim()}
                      className="flex-1 py-2.5 rounded-xl font-body font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      Send Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestChangesMode(false)}
                      className="px-4 py-2.5 rounded-xl font-body text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApproveCook}
                    className="flex-1 py-2.5 rounded-xl font-body font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Approve ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestChangesMode(true)}
                    className="flex-1 py-2.5 rounded-xl font-body font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSuspendCook}
                    className="flex-1 py-2.5 rounded-xl font-body font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Suspend
                  </button>
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Assign Cook Drawer */}
      <Drawer open={assignDrawerOpen} onOpenChange={setAssignDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">
              Assign a Cook — {assignBooking?.customer_name}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {assignBooking && (
              <div className="font-body text-xs text-muted-foreground mb-4 space-y-0.5">
                <p>Date: {assignBooking.booking_date || "—"}</p>
                <p>Area: {assignBooking.area || "—"}</p>
                <p>Dietary: {assignBooking.dietary?.join(", ") || "None"}</p>
                <p>Menu: {assignBooking.menu_selected}</p>
              </div>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableCooks.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCookId(c.id)}
                  className={`w-full text-left rounded-xl p-3 border transition-colors ${
                    selectedCookId === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <p className="font-body text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.cuisine?.join(" · ") || "—"} · {c.area || "—"} · {c.years_experience ?? 0}y
                  </p>
                </button>
              ))}
              {availableCooks.length === 0 && (
                <p className="font-body text-sm text-muted-foreground text-center py-4">No approved cooks available</p>
              )}
            </div>
            <button
              onClick={confirmAssignment}
              disabled={!selectedCookId || assigning}
              className="w-full mt-4 py-3 rounded-xl font-body font-semibold text-sm text-background bg-copper hover:bg-copper/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Assignment
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ── Helpers ──
const StatCard = forwardRef<HTMLDivElement, { label: string; value: string | number }>(
  ({ label, value }, ref) => (
    <div ref={ref} className="bg-card rounded-xl p-3 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-display text-lg text-foreground">{value}</p>
    </div>
  )
);
StatCard.displayName = "StatCard";

const AlertItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-start gap-2 py-1.5">
    {icon}
    <p className="font-body text-xs text-foreground">{text}</p>
  </div>
);

export default Admin;
