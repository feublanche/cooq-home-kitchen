import { useEffect, useState, useCallback, forwardRef } from "react";
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
  Upload,
  Image as ImageIcon,
  Loader2,
  Send,
} from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  cook_name: string;
  cook_id: string;
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

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("supply");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [photos, setPhotos] = useState<QualityPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBookings();
    fetchPhotos();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  // ── Menu Vetting Actions ──
  const handleMenuAction = async (booking: Booking, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("bookings")
      .update({ menu_status: action } as any)
      .eq("id", booking.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update menu status", variant: "destructive" });
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, menu_status: action } : b))
    );

    // Send notification to cook
    notifyCook(booking, action === "approved" ? "menu_approved" : "menu_rejected");

    toast({
      title: action === "approved" ? "Menu Approved ✓" : "Menu Rejected",
      description: `${booking.cook_name}'s menu "${booking.menu_selected}" has been ${action}.`,
    });
  };

  // ── Cook Notification ──
  const notifyCook = async (booking: Booking, eventType: string) => {
    try {
      await supabase.functions.invoke("notify-cook", {
        body: {
          cook_name: booking.cook_name,
          cook_email: booking.email,
          cook_phone: booking.phone,
          event_type: eventType,
          booking_details: {
            menu: booking.menu_selected,
            date: booking.booking_date,
            customer_name: booking.customer_name,
            area: booking.area,
          },
        },
      });
    } catch (err) {
      console.error("Notification failed:", err);
    }
  };

  // ── Photo Upload ──
  const handlePhotoUpload = async (
    bookingId: string,
    cookId: string,
    cookName: string,
    photoType: "container" | "kitchen",
    file: File
  ) => {
    setUploading(`${bookingId}-${photoType}`);
    const filePath = `${cookId}/${bookingId}/${photoType}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("proof-photos")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("proof-photos").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("quality_photos").insert({
      booking_id: bookingId,
      cook_id: cookId,
      cook_name: cookName,
      photo_type: photoType,
      photo_url: urlData.publicUrl,
    } as any);

    if (insertError) {
      toast({ title: "Save failed", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Photo uploaded ✓", description: `${photoType} photo saved successfully.` });
      fetchPhotos();
    }
    setUploading(null);
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

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_aed || 0), 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

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
        <span className="font-body text-xs text-background/70 uppercase tracking-wider">Operator Dashboard</span>
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
            <h2 className="font-display text-xl text-foreground mb-1">Supply Manager</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Review/Approve new Cook applications (Visa/EID check)
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Pending" value={pendingCount} />
              <StatCard label="Active Cooks" value={confirmedCount} />
              <StatCard label="Total" value={bookings.length} />
            </div>
            <div className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="font-body text-sm font-semibold text-foreground mb-2">Alerts</p>
              <div className="space-y-2">
                <AlertItem icon={<AlertTriangle className="w-4 h-4 text-copper" />} text='Late check-ins or missing "Proof Photos"' />
                <AlertItem icon={<ShieldCheck className="w-4 h-4 text-primary" />} text="All visa/health certificates up to date" />
              </div>
            </div>
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

        {/* ── Menu Vetting Queue ── */}
        {activeTab === "vetting" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Menu Vetting Queue</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Review proposed menus for balance, appeal, and accurate ingredient lists
            </p>
            <div className="space-y-3">
              {bookings.map((b) => {
                const ms = (b as any).menu_status || "pending_review";
                return (
                  <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{b.cook_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{b.menu_selected}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${menuStatusColors[ms] || ""}`}>
                          {ms === "pending_review" ? "Pending" : ms === "approved" ? "Approved" : "Rejected"}
                        </span>
                        {ms === "pending_review" && (
                          <>
                            <button
                              onClick={() => handleMenuAction(b, "approved")}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMenuAction(b, "rejected")}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">
                      Dietary: {b.dietary?.join(", ") || "None"}
                    </p>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <p className="font-body text-sm text-muted-foreground text-center py-8">No menus to review</p>
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

        {/* ── Proof of Quality ── */}
        {activeTab === "proof" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Proof of Quality</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">
              Upload photo of prepped containers + photo of spotless kitchen
            </p>

            {/* Upload section per booking */}
            <div className="space-y-4 mb-6">
              {bookings
                .filter((b) => b.status === "confirmed" || b.status === "completed")
                .slice(0, 10)
                .map((b) => {
                  const bookingPhotos = photos.filter((p) => p.booking_id === b.id);
                  const hasContainer = bookingPhotos.some((p) => p.photo_type === "container");
                  const hasKitchen = bookingPhotos.some((p) => p.photo_type === "kitchen");

                  return (
                    <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-body text-sm font-semibold text-foreground">{b.cook_name}</p>
                          <p className="font-body text-xs text-muted-foreground">{b.booking_date || "No date"} · {b.area || "—"}</p>
                        </div>
                        <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[b.status] || ""}`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Container photo */}
                        <div className="relative">
                          {hasContainer ? (
                            <div className="relative rounded-lg overflow-hidden aspect-square bg-muted">
                              <img
                                src={bookingPhotos.find((p) => p.photo_type === "container")?.photo_url}
                                alt="Container"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 px-2 py-1">
                                <p className="font-body text-[10px] text-background">Containers ✓</p>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                              {uploading === `${b.id}-container` ? (
                                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                  <span className="font-body text-[10px] text-muted-foreground">Containers</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(b.id, b.cook_id, b.cook_name, "container", file);
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Kitchen photo */}
                        <div className="relative">
                          {hasKitchen ? (
                            <div className="relative rounded-lg overflow-hidden aspect-square bg-muted">
                              <img
                                src={bookingPhotos.find((p) => p.photo_type === "kitchen")?.photo_url}
                                alt="Kitchen"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 px-2 py-1">
                                <p className="font-body text-[10px] text-background">Kitchen ✓</p>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                              {uploading === `${b.id}-kitchen` ? (
                                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                  <span className="font-body text-[10px] text-muted-foreground">Kitchen</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(b.id, b.cook_id, b.cook_name, "kitchen", file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length === 0 && (
                <div className="bg-card rounded-xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                  <Camera className="w-10 h-10 text-copper mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">No sessions ready for photo upload</p>
                </div>
              )}
            </div>

            {/* Review queue */}
            {photos.filter((p) => !p.reviewed).length > 0 && (
              <div>
                <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-3">Pending Review</p>
                <div className="space-y-3">
                  {photos
                    .filter((p) => !p.reviewed)
                    .map((p) => (
                      <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex gap-3 items-center" style={{ boxShadow: "var(--shadow-card)" }}>
                        <img src={p.photo_url} alt={p.photo_type} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <p className="font-body text-sm font-semibold text-foreground">{p.cook_name}</p>
                          <p className="font-body text-xs text-muted-foreground capitalize">{p.photo_type} photo</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePhotoReview(p.id, true)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePhotoReview(p.id, false)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
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
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Total Revenue" value={`AED ${totalRevenue}`} />
              <StatCard label="Completed" value={completedCount} />
              <StatCard label="Pending Payouts" value={confirmedCount} />
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
          </div>
        )}
      </div>
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
