import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
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
  Eye,
} from "lucide-react";

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
  phone: string;
  email: string;
  created_at: string;
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

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("supply");
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

      {/* Tab bar — horizontal scroll */}
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
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{b.cook_name}</p>
                      <p className="font-body text-xs text-muted-foreground">{b.menu_selected}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    Dietary: {b.dietary?.join(", ") || "None"}
                  </p>
                </div>
              ))}
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

            <div className="bg-card rounded-xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <Camera className="w-10 h-10 text-copper mx-auto mb-3" />
              <p className="font-body text-sm font-semibold text-foreground mb-1">Photo Upload Queue</p>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Cooks upload photos of prepped containers and clean kitchen after each session.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs font-semibold text-foreground">Prepped Containers</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">Labelled, sealed, fridge-ready</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="font-body text-xs font-semibold text-foreground">Kitchen Photo</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">Spotless after cooking</p>
                </div>
              </div>
            </div>
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

            {/* Recent bookings */}
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
const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-card rounded-xl p-3 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="font-display text-lg text-foreground">{value}</p>
  </div>
);

const AlertItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-start gap-2 py-1.5">
    {icon}
    <p className="font-body text-xs text-foreground">{text}</p>
  </div>
);

export default Admin;
