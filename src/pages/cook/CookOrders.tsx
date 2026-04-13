import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Phone, Mail, ClipboardList } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO } from "date-fns";

interface Order {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  area: string | null;
  address: string | null;
  booking_date: string | null;
  menu_selected: string;
  dietary: string[] | null;
  allergies_notes: string | null;
  grocery_addon: boolean | null;
  grocery_fee: number | null;
  total_aed: number | null;
  status: string | null;
  tier: string | null;
  session_type: string | null;
  session_notes: string | null;
  party_size: number | null;
  frequency: string | null;
  created_at: string;
}

const filterTabs = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

const statusBadge: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(181,126,93,0.1)", text: "#B57E5D" },
  confirmed: { bg: "rgba(134,163,131,0.1)", text: "#86A383" },
  completed: { bg: "rgba(0,0,0,0.05)", text: "rgba(45,49,46,0.5)" },
  cancelled: { bg: "rgba(239,68,68,0.08)", text: "#ef4444" },
};

const CookOrders = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!cook) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("cook_id", cook.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Order[];
      setOrders(list);
      setPendingCount(list.filter((o) => o.status === "pending").length);
      setLoading(false);
    };
    fetch();
  }, [cook]);

  const filtered = filter === "All" ? orders : orders.filter((o) => o.status?.toLowerCase() === filter.toLowerCase());

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "EEE d MMM"); } catch { return d; }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-foreground" style={{ fontSize: "20px" }}>My Orders</h1>
      </div>

      <div className="sticky top-0 z-10 flex overflow-x-auto bg-background border-b border-gray-100">
        {filterTabs.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className="px-4 py-3 font-body whitespace-nowrap" style={{ fontSize: "12px", color: filter === tab ? "#86A383" : "rgba(45,49,46,0.4)", borderBottom: filter === tab ? "2px solid #86A383" : "2px solid transparent" }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl animate-pulse bg-card border border-gray-100" style={{ height: "80px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <ClipboardList className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body text-muted-foreground" style={{ fontSize: "13px" }}>No {filter.toLowerCase()} orders yet.</p>
          </div>
        ) : (
          filtered.map((o) => {
            const isExpanded = expanded === o.id;
            const badge = statusBadge[o.status || "pending"];
            const customerFirstName = o.customer_name?.split(" ")[0] || "Customer";
            const isSessionDay = o.booking_date ? new Date().toDateString() === new Date(o.booking_date).toDateString() : false;
            const showContact = isSessionDay && o.status === "confirmed";

            return (
              <div key={o.id} className="rounded-xl overflow-hidden mb-2 bg-card border border-gray-100">
                <div className="flex items-center p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : o.id)}>
                  <span className="flex-1 font-body font-bold text-foreground" style={{ fontSize: "13px" }}>{customerFirstName}</span>
                  <span className="font-body rounded-full px-2.5 py-0.5 mr-2" style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.text }}>
                    {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : "Pending"}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>

                <div className="px-4 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>{formatDate(o.booking_date)}</span>
                    <span className="font-body text-muted-foreground" style={{ fontSize: "11px" }}>{o.area || "—"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-body font-bold" style={{ fontSize: "12px", color: "#86A383" }}>
                      AED {o.total_aed ?? 350} · Your share: AED {Math.round((o.total_aed ?? 350) * 0.75)}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <DetailRow label="Tier" value={`${(o.tier || "duo").charAt(0).toUpperCase() + (o.tier || "duo").slice(1)} · ${o.session_type === "discovery" ? "First Cook" : "Standard"}`} />
                    <DetailRow label="Menu" value={o.menu_selected} italic />
                    <DetailRow label="Dietary" value={o.dietary?.join(" · ") || "None"} />
                    <DetailRow label="Allergies" value={o.allergies_notes || "None"} />
                    <DetailRow label="Grocery" value={o.grocery_addon ? "AED 75 flat fee" : "Not required"} />
                    <DetailRow label="Party size" value={`${o.party_size ?? 2} people`} />
                    <DetailRow label="Frequency" value={o.frequency || "One-time"} />

                    {showContact ? (
                      <div className="space-y-1 pt-1">
                        <a href={`tel:${o.phone}`} className="flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: "#86A383" }} />
                          <span className="font-body text-foreground" style={{ fontSize: "12px" }}>{o.phone}</span>
                        </a>
                        {o.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" style={{ color: "#86A383" }} />
                            <span className="font-body text-foreground" style={{ fontSize: "12px" }}>{o.address}</span>
                          </div>
                        )}
                        <a href={`mailto:${o.email}`}><Mail className="w-4 h-4 inline" style={{ color: "#86A383" }} /></a>
                      </div>
                    ) : o.status === "confirmed" ? (
                      <p className="font-body italic rounded-lg p-2 mt-1" style={{ fontSize: "11px", color: "#86A383", backgroundColor: "rgba(134,163,131,0.08)" }}>
                        📍 Full address and contact revealed on your session day
                      </p>
                    ) : o.status === "pending" ? (
                      <p className="font-body italic rounded-lg p-2 mt-1" style={{ fontSize: "11px", color: "#B57E5D", backgroundColor: "rgba(181,126,93,0.08)" }}>
                        ⏳ Awaiting confirmation from Cooq
                      </p>
                    ) : null}

                    {o.session_notes && (
                      <p className="font-body italic text-muted-foreground" style={{ fontSize: "11px" }}>{o.session_notes}</p>
                    )}

                    {o.status === "confirmed" && (
                      <button
                        className="w-full rounded-xl py-3 mt-3 font-body font-semibold"
                        style={{ fontSize: "14px", backgroundColor: "#B57E5D", color: "#F9F7F2" }}
                        onClick={() => navigate("/cook/photo-upload", { state: { bookingId: o.id, customerName: o.customer_name } })}
                      >
                        Upload Proof Photos →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CookBottomNav pendingCount={pendingCount} />
    </div>
  );
};

const DetailRow = ({ label, value, italic }: { label: string; value: string; italic?: boolean }) => (
  <div>
    <p className="uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace" }}>{label}</p>
    <p className={`font-body text-foreground ${italic ? "italic" : ""}`} style={{ fontSize: "12px" }}>{value}</p>
  </div>
);

export default CookOrders;
