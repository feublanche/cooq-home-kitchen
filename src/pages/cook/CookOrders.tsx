import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  ClipboardList,
} from "lucide-react";
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
  pending: { bg: "rgba(181,126,93,0.15)", text: "#B57E5D" },
  confirmed: { bg: "rgba(134,163,131,0.15)", text: "#86A383" },
  completed: { bg: "rgba(249,247,242,0.1)", text: "rgba(249,247,242,0.5)" },
  cancelled: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
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

  const filtered =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status?.toLowerCase() === filter.toLowerCase());

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return format(parseISO(d), "EEE d MMM");
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#2D312E" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" style={{ color: "#F9F7F2" }} />
        </button>
        <h1 className="font-display" style={{ fontSize: "20px", color: "#F9F7F2" }}>
          My Orders
        </h1>
      </div>

      {/* Filter tabs */}
      <div
        className="sticky top-0 z-10 flex overflow-x-auto"
        style={{ backgroundColor: "#2D312E", borderBottom: "1px solid rgba(134,163,131,0.15)" }}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="px-4 py-3 font-body whitespace-nowrap"
            style={{
              fontSize: "12px",
              color: filter === tab ? "#86A383" : "rgba(249,247,242,0.4)",
              borderBottom: filter === tab ? "2px solid #86A383" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ backgroundColor: "rgba(249,247,242,0.05)", height: "80px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <ClipboardList className="w-8 h-8 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body" style={{ fontSize: "13px", color: "rgba(249,247,242,0.5)" }}>
              No {filter.toLowerCase()} orders yet.
            </p>
          </div>
        ) : (
          filtered.map((o) => {
            const isExpanded = expanded === o.id;
            const badge = statusBadge[o.status || "pending"];
            const customerFirstName = o.customer_name?.split(" ")[0] || "Customer";

            // Contact reveal logic
            const isSessionDay = o.booking_date
              ? new Date().toDateString() === new Date(o.booking_date).toDateString()
              : false;
            const showContact = isSessionDay && o.status === "confirmed";

            return (
              <div
                key={o.id}
                className="rounded-xl overflow-hidden mb-2"
                style={{
                  backgroundColor: "rgba(249,247,242,0.05)",
                  border: "1px solid rgba(134,163,131,0.18)",
                }}
              >
                {/* Collapsed header */}
                <div className="flex items-center p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : o.id)}>
                  <span className="flex-1 font-body font-bold" style={{ fontSize: "13px", color: "#F9F7F2" }}>
                    {customerFirstName}
                  </span>
                  <span
                    className="font-body rounded-full px-2.5 py-0.5 mr-2"
                    style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.text }}
                  >
                    {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : "Pending"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: "rgba(249,247,242,0.3)" }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: "rgba(249,247,242,0.3)" }} />
                  )}
                </div>

                {/* Always visible */}
                <div className="px-4 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>
                      {formatDate(o.booking_date)}
                    </span>
                    <span className="font-body" style={{ fontSize: "11px", color: "rgba(249,247,242,0.5)" }}>
                      {o.area || "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-body font-bold" style={{ fontSize: "12px", color: "#86A383" }}>
                      AED {o.total_aed ?? 350} · Your share: AED {Math.round((o.total_aed ?? 350) * 0.75)}
                    </span>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <DetailRow label="Tier" value={`${(o.tier || "duo").charAt(0).toUpperCase() + (o.tier || "duo").slice(1)} · ${o.session_type === "discovery" ? "First Cook" : "Standard"}`} />
                    <DetailRow label="Menu" value={o.menu_selected} italic />
                    <DetailRow label="Dietary" value={o.dietary?.join(" · ") || "None"} />
                    <DetailRow label="Allergies" value={o.allergies_notes || "None"} />
                    <DetailRow label="Grocery" value={o.grocery_addon ? "AED 75 flat fee" : "Not required"} />
                    <DetailRow label="Party size" value={`${o.party_size ?? 2} people`} />
                    <DetailRow label="Frequency" value={o.frequency || "One-time"} />

                    {/* Contact reveal */}
                    {showContact ? (
                      <div className="space-y-1 pt-1">
                        <a href={`tel:${o.phone}`} className="flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: "#86A383" }} />
                          <span className="font-body" style={{ fontSize: "12px", color: "#F9F7F2" }}>{o.phone}</span>
                        </a>
                        {o.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" style={{ color: "#86A383" }} />
                            <span className="font-body" style={{ fontSize: "12px", color: "#F9F7F2" }}>{o.address}</span>
                          </div>
                        )}
                        <a href={`mailto:${o.email}`}>
                          <Mail className="w-4 h-4 inline" style={{ color: "#86A383" }} />
                        </a>
                      </div>
                    ) : o.status === "confirmed" ? (
                      <p className="font-body italic rounded-lg p-2 mt-1" style={{ fontSize: "11px", color: "#86A383", backgroundColor: "rgba(134,163,131,0.1)" }}>
                        📍 Full address and contact revealed on your session day
                      </p>
                    ) : o.status === "pending" ? (
                      <p className="font-body italic rounded-lg p-2 mt-1" style={{ fontSize: "11px", color: "#B57E5D", backgroundColor: "rgba(181,126,93,0.1)" }}>
                        ⏳ Awaiting confirmation from Cooq
                      </p>
                    ) : null}

                    {o.session_notes && (
                      <p className="font-body italic" style={{ fontSize: "11px", color: "rgba(249,247,242,0.5)" }}>
                        {o.session_notes}
                      </p>
                    )}

                    {o.status === "confirmed" && (
                      <button
                        className="w-full rounded-xl py-3 mt-3 font-body font-semibold"
                        style={{ fontSize: "14px", backgroundColor: "#B57E5D", color: "#F9F7F2" }}
                        onClick={() =>
                          navigate("/cook/photo-upload", {
                            state: { bookingId: o.id, customerName: o.customer_name },
                          })
                        }
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
    <p className="uppercase tracking-wider" style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(249,247,242,0.4)" }}>
      {label}
    </p>
    <p className={`font-body ${italic ? "italic" : ""}`} style={{ fontSize: "12px", color: "#F9F7F2" }}>
      {value}
    </p>
  </div>
);

export default CookOrders;
