import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO, differenceInHours } from "date-fns";

interface Order {
  id: string;
  customer_name: string;
  address: string | null;
  area: string | null;
  booking_date: string | null;
  menu_selected: string;
  status: string | null;
  tier: string | null;
  total_aed: number | null;
  created_at: string;
  proof_status: string | null;
  proof_notes: string | null;
}

const CookOrders = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef1 = useRef<HTMLInputElement | null>(null);
  const fileRef2 = useRef<HTMLInputElement | null>(null);
  const [proofFiles, setProofFiles] = useState<{ kitchen: File | null; containers: File | null }>({ kitchen: null, containers: null });
  const [proofBookingId, setProofBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!cook) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_name, address, area, booking_date, menu_selected, status, tier, total_aed, created_at, proof_status, proof_notes")
        .eq("cook_id", cook.id)
        .order("booking_date", { ascending: true });

      const list = (data ?? []) as Order[];
      const completed = list.filter((o) => o.status === "completed").length;
      setCompletedCount(completed);

      const statusOrder: Record<string, number> = { confirmed: 0, pending: 1, completed: 2, cancelled: 3 };
      list.sort((a, b) => (statusOrder[a.status || "pending"] ?? 1) - (statusOrder[b.status || "pending"] ?? 1));

      setOrders(list);
      setLoading(false);
    };
    fetchOrders();
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

  const statusBadge = (s: string | null, proofStatus: string | null) => {
    if (s === "cancelled") return { bg: "rgba(239,68,68,0.08)", color: "#ef4444", label: "Cancelled" };
    if (s === "completed" || proofStatus === "approved") return { bg: "rgba(134,163,131,0.15)", color: "#86A383", label: "Session complete ✓" };
    if (s === "confirmed") return { bg: "rgba(134,163,131,0.15)", color: "#86A383", label: "Upcoming" };
    return { bg: "rgba(181,126,93,0.1)", color: "#B57E5D", label: "Pending" };
  };

  const isSessionPast = (d: string | null) => {
    if (!d) return false;
    try { return new Date(d) < new Date(); } catch { return false; }
  };

  const isWithin24Hours = (d: string | null) => {
    if (!d) return false;
    try {
      const sessionDate = parseISO(d);
      return differenceInHours(sessionDate, new Date()) <= 24;
    } catch { return false; }
  };

  const handleProofUpload = async (bookingId: string) => {
    if (!cook || !proofFiles.kitchen || !proofFiles.containers) {
      toast({ title: "Please select both photos", variant: "destructive" });
      return;
    }

    setUploadingId(bookingId);

    try {
      for (const [type, file] of Object.entries({ kitchen: proofFiles.kitchen, containers: proofFiles.containers })) {
        if (!file) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${bookingId}/${type}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("proof-photos").upload(path, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        await supabase.from("quality_photos").insert({
          booking_id: bookingId,
          cook_id: cook.id,
          cook_name: cook.name,
          photo_type: type === "kitchen" ? "clean_kitchen" : "labelled_containers",
          photo_url: path,
        } as any);
      }

      await supabase.from("bookings").update({ proof_status: "pending_review" } as any).eq("id", bookingId);
      setOrders((prev) => prev.map((o) => o.id === bookingId ? { ...o, proof_status: "pending_review" } : o));

      const order = orders.find((o) => o.id === bookingId);
      const isResubmit = order?.proof_status === "resubmit";

      try {
        await supabase.functions.invoke("notify-operator", {
          body: {
            event_type: isResubmit ? "proof_resubmitted" : "proof_uploaded",
            details: { cook_name: cook.name, date: order?.booking_date },
          },
        });
      } catch {}

      toast({ title: "Proof uploaded ✓", description: "Under review by the Cooq team." });
      setProofBookingId(null);
      setProofFiles({ kitchen: null, containers: null });
    } catch (err: any) {
      toast({ title: "Upload failed: " + (err?.message || "Unknown error"), variant: "destructive" });
    }
    setUploadingId(null);
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
            const badge = statusBadge(o.status, o.proof_status);
            const customerFirst = o.customer_name?.split(" ")[0] || "Customer";
            const cookEarnings = Math.round((o.total_aed ?? 350) * earningsRate);
            const showAddress = isWithin24Hours(o.booking_date) || isSessionPast(o.booking_date);
            const needsProof = isSessionPast(o.booking_date) && !o.proof_status && o.status !== "cancelled";
            const needsResubmit = o.proof_status === "resubmit";
            const isProofMode = proofBookingId === o.id;

            return (
              <div key={o.id} className="rounded-xl p-4 mb-2 bg-white border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-body font-bold" style={{ fontSize: "14px", color: "#2C3B3A" }}>{customerFirst}</span>
                  <span className="font-body rounded-full px-2.5 py-0.5" style={{ fontSize: "10px", backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#86A383" }}>{formatDate(o.booking_date)}</span>
                  <span className="font-body" style={{ fontSize: "11px", color: "#999" }}>{tierLabel(o.tier)}</span>
                </div>

                <p className="font-body italic mt-1" style={{ fontSize: "12px", color: "#666" }}>{o.menu_selected}</p>

                {/* Address */}
                <p className="font-body mt-1" style={{ fontSize: "11px", color: showAddress ? "#2C3B3A" : "#ccc" }}>
                  {showAddress ? (o.address || "No address provided") : "📍 Address revealed on session day"}
                </p>

                <p className="font-body font-semibold mt-2" style={{ fontSize: "12px", color: "#86A383" }}>
                  Your earnings: AED {cookEarnings}
                </p>

                {/* Proof status badges */}
                {o.proof_status === "pending_review" && (
                  <div className="mt-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: "rgba(181,126,93,0.08)", border: "1px solid rgba(181,126,93,0.15)" }}>
                    <p className="font-body" style={{ fontSize: "11px", color: "#B57E5D" }}>📸 Proof submitted — under review</p>
                  </div>
                )}
                {o.proof_status === "approved" && (
                  <div className="mt-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.15)" }}>
                    <p className="font-body" style={{ fontSize: "11px", color: "#86A383" }}>✓ Session complete — earnings added to this month</p>
                  </div>
                )}

                {/* Resubmit alert with notes */}
                {needsResubmit && (
                  <div className="mt-2 rounded-lg p-2.5" style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <p className="font-body font-semibold" style={{ fontSize: "11px", color: "#D97706" }}>⚠️ Please re-upload your proof photos</p>
                    {o.proof_notes && (
                      <p className="font-body mt-1" style={{ fontSize: "11px", color: "#92400E" }}>{o.proof_notes}</p>
                    )}
                  </div>
                )}

                {/* Upload proof button */}
                {(needsProof || needsResubmit) && !isProofMode && (
                  <button
                    onClick={() => { setProofBookingId(o.id); setProofFiles({ kitchen: null, containers: null }); }}
                    className="flex items-center gap-2 mt-2 rounded-lg px-4 py-2 font-body text-sm"
                    style={{ backgroundColor: needsResubmit ? "rgba(245,158,11,0.1)" : "rgba(184,115,85,0.1)", color: needsResubmit ? "#D97706" : "#B87355" }}
                  >
                    <Upload className="w-4 h-4" />
                    {needsResubmit ? "Re-upload proof" : "Upload proof of completion"}
                  </button>
                )}

                {/* Proof upload form */}
                {isProofMode && (
                  <div className="mt-3 space-y-2 p-3 rounded-lg" style={{ backgroundColor: "rgba(134,163,131,0.05)", border: "1px solid rgba(134,163,131,0.15)" }}>
                    <p className="font-body text-xs font-semibold" style={{ color: "#2C3B3A" }}>Upload 2 photos:</p>

                    <div>
                      <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>1. Clean kitchen</label>
                      <input ref={fileRef1} type="file" accept="image/*" onChange={(e) => setProofFiles((p) => ({ ...p, kitchen: e.target.files?.[0] || null }))} className="font-body text-xs" />
                    </div>

                    <div>
                      <label className="font-body text-xs block mb-1" style={{ color: "#666" }}>2. Labelled containers</label>
                      <input ref={fileRef2} type="file" accept="image/*" onChange={(e) => setProofFiles((p) => ({ ...p, containers: e.target.files?.[0] || null }))} className="font-body text-xs" />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProofUpload(o.id)}
                        disabled={!proofFiles.kitchen || !proofFiles.containers || uploadingId === o.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-semibold disabled:opacity-50"
                        style={{ backgroundColor: "#86A383", color: "#FAF9F6" }}
                      >
                        {uploadingId === o.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit
                      </button>
                      <button onClick={() => setProofBookingId(null)} className="font-body text-xs" style={{ color: "#999" }}>Cancel</button>
                    </div>
                  </div>
                )}
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
