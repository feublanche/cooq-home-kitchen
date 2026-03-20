import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { Camera, X, Loader2 } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";
import { format, parseISO } from "date-fns";

interface SessionOption {
  id: string;
  customer_name: string;
  booking_date: string | null;
  area: string | null;
  menu_selected: string;
}

interface PastUpload {
  id: string;
  photo_type: string;
  photo_url: string;
  uploaded_at: string;
  reviewed: boolean | null;
  approved: boolean | null;
}

const CookPhotoUpload = () => {
  const { cook } = useCook();
  const location = useLocation();
  const state = location.state as { bookingId?: string; customerName?: string } | null;

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [containerFile, setContainerFile] = useState<File | null>(null);
  const [kitchenFile, setKitchenFile] = useState<File | null>(null);
  const [containerPreview, setContainerPreview] = useState<string | null>(null);
  const [kitchenPreview, setKitchenPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pastUploads, setPastUploads] = useState<PastUpload[]>([]);

  const containerRef = useRef<HTMLInputElement>(null);
  const kitchenRef = useRef<HTMLInputElement>(null);

  const selected = sessions.find((s) => s.id === selectedId);

  useEffect(() => {
    if (!cook) return;
    const fetch = async () => {
      const [sessRes, pastRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, customer_name, booking_date, area, menu_selected")
          .eq("cook_id", cook.id)
          .in("status", ["confirmed", "completed"])
          .order("booking_date", { ascending: false })
          .limit(20),
        supabase
          .from("quality_photos")
          .select("id, photo_type, photo_url, uploaded_at, reviewed, approved")
          .eq("cook_id", cook.id)
          .order("uploaded_at", { ascending: false })
          .limit(10),
      ]);
      setSessions((sessRes.data ?? []) as SessionOption[]);
      setPastUploads((pastRes.data ?? []) as PastUpload[]);

      if (state?.bookingId) setSelectedId(state.bookingId);
    };
    fetch();
  }, [cook, state?.bookingId]);

  const handleFile = (type: "container" | "kitchen", file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "container") {
      setContainerFile(file);
      setContainerPreview(url);
    } else {
      setKitchenFile(file);
      setKitchenPreview(url);
    }
  };

  const clearFile = (type: "container" | "kitchen") => {
    if (type === "container") {
      setContainerFile(null);
      setContainerPreview(null);
    } else {
      setKitchenFile(null);
      setKitchenPreview(null);
    }
  };

  const validateFile = (file: File): boolean => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG, PNG or WebP images allowed.", variant: "destructive" });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 10MB.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!cook || !selectedId || !containerFile || !kitchenFile) return;
    if (!validateFile(containerFile)) return;
    if (!validateFile(kitchenFile)) return;
    setUploading(true);

    // Upload container
    const cPath = `${cook.id}/${selectedId}/container-${Date.now()}.jpg`;
    const { error: cErr } = await supabase.storage.from("proof-photos").upload(cPath, containerFile, { upsert: true });
    if (cErr) {
      toast({ title: "Container upload failed.", variant: "destructive" });
      setUploading(false);
      return;
    }

    // Upload kitchen
    const kPath = `${cook.id}/${selectedId}/kitchen-${Date.now()}.jpg`;
    const { error: kErr } = await supabase.storage.from("proof-photos").upload(kPath, kitchenFile, { upsert: true });
    if (kErr) {
      toast({ title: "Kitchen upload failed.", variant: "destructive" });
      setUploading(false);
      return;
    }

    // Store path only, not public URL — signed URLs generated on demand
    const cUrl = cPath;
    const kUrl = kPath;

    const { error: insErr } = await supabase.from("quality_photos").insert([
      {
        booking_id: selectedId,
        cook_id: cook.id,
        cook_name: cook.name,
        photo_type: "container",
        photo_url: cUrl,
      },
      {
        booking_id: selectedId,
        cook_id: cook.id,
        cook_name: cook.name,
        photo_type: "kitchen",
        photo_url: kUrl,
      },
    ]);

    if (insErr) {
      toast({ title: "Failed to save photos.", variant: "destructive" });
    } else {
      toast({ title: "Photos submitted ✓", description: "Payment releases within 24h of review." });
      setContainerFile(null);
      setContainerPreview(null);
      setKitchenFile(null);
      setKitchenPreview(null);
      setSelectedId("");
      // Refetch past uploads
      const { data } = await supabase
        .from("quality_photos")
        .select("id, photo_type, photo_url, uploaded_at, reviewed, approved")
        .eq("cook_id", cook.id)
        .order("uploaded_at", { ascending: false })
        .limit(10);
      setPastUploads((data ?? []) as PastUpload[]);
    }
    setUploading(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return format(parseISO(d), "d MMM h:mma");
    } catch {
      return d;
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(249,247,242,0.06)",
    border: "1px solid rgba(134,163,131,0.25)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#F9F7F2",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    appearance: "none",
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6" style={{ backgroundColor: "#2D312E" }}>
      <h1 className="font-display" style={{ fontSize: "22px", color: "#F9F7F2" }}>
        Proof of Quality
      </h1>
      <p className="font-body mb-6" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
        Required after every session
      </p>

      {/* Step 1 */}
      <p
        className="uppercase tracking-wider mb-2"
        style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
      >
        Select Your Session
      </p>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={inputStyle}
      >
        <option value="" style={{ backgroundColor: "#2D312E" }}>Choose a session...</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id} style={{ backgroundColor: "#2D312E" }}>
            {s.customer_name} — {s.booking_date || "—"} — {s.area || "—"}
          </option>
        ))}
      </select>

      {selected && (
        <div
          className="rounded-xl p-4 mt-2"
          style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.25)" }}
        >
          <p className="font-body" style={{ fontSize: "12px", color: "#F9F7F2" }}>
            {selected.customer_name} · {selected.booking_date} · {selected.area}
          </p>
          <p className="font-body italic" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            {selected.menu_selected}
          </p>
          <p className="font-body mt-1" style={{ fontSize: "11px", color: "#86A383" }}>
            Upload your proof photos below
          </p>
        </div>
      )}

      {/* Step 2 */}
      {selectedId && (
        <>
          <p
            className="uppercase tracking-wider mb-2 mt-6"
            style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
          >
            Upload Photos
          </p>
          <p className="font-body mb-4" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
            Photo of prepped labelled containers AND photo of the clean kitchen.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Container zone */}
            <UploadZone
              label="Containers"
              preview={containerPreview}
              inputRef={containerRef}
              onFile={(f) => handleFile("container", f)}
              onClear={() => clearFile("container")}
            />
            {/* Kitchen zone */}
            <UploadZone
              label="Clean Kitchen"
              preview={kitchenPreview}
              inputRef={kitchenRef}
              onFile={(f) => handleFile("kitchen", f)}
              onClear={() => clearFile("kitchen")}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!containerFile || !kitchenFile || uploading}
            className="w-full rounded-xl py-4 mt-4 font-body font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ fontSize: "14px", backgroundColor: "#B57E5D", color: "#F9F7F2" }}
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Uploading..." : "Submit Photos"}
          </button>
        </>
      )}

      {/* Past uploads */}
      <div className="mt-8">
        <p
          className="uppercase tracking-wider mb-3"
          style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#B57E5D" }}
        >
          Recent Uploads
        </p>
        {pastUploads.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <Camera className="w-6 h-6 mb-2" style={{ color: "#86A383" }} />
            <p className="font-body text-center" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
              No uploads yet. Upload after each session to receive payment.
            </p>
          </div>
        ) : (
          pastUploads.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: "1px solid rgba(249,247,242,0.06)" }}
            >
              <img
                src={p.photo_url}
                alt={p.photo_type}
                className="rounded-lg object-cover"
                style={{ width: "48px", height: "48px" }}
              />
              <div className="flex-1">
                <p className="font-body capitalize" style={{ fontSize: "12px", color: "#F9F7F2" }}>
                  {p.photo_type}
                </p>
                <p className="font-body" style={{ fontSize: "10px", color: "rgba(249,247,242,0.4)" }}>
                  {formatDate(p.uploaded_at)}
                </p>
              </div>
              <span
                className="font-body"
                style={{
                  fontSize: "11px",
                  color: !p.reviewed
                    ? "#B57E5D"
                    : p.approved
                    ? "#86A383"
                    : "#ef4444",
                }}
              >
                {!p.reviewed ? "Pending" : p.approved ? "Approved ✓" : "Rejected"}
              </span>
            </div>
          ))
        )}
      </div>

      <CookBottomNav />
    </div>
  );
};

const UploadZone = ({
  label,
  preview,
  inputRef,
  onFile,
  onClear,
}: {
  label: string;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFile: (f: File | null) => void;
  onClear: () => void;
}) => (
  <div
    className="aspect-square rounded-xl overflow-hidden cursor-pointer relative"
    style={
      preview
        ? {}
        : {
            backgroundColor: "rgba(249,247,242,0.04)",
            border: "2px dashed rgba(134,163,131,0.3)",
          }
    }
    onClick={() => !preview && inputRef.current?.click()}
  >
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={(e) => onFile(e.target.files?.[0] ?? null)}
    />
    {preview ? (
      <>
        <img src={preview} alt={label} className="w-full h-full object-cover" />
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-1"
          style={{ backgroundColor: "rgba(26,31,27,0.8)" }}
        >
          <span style={{ fontSize: "10px", color: "#86A383" }}>✓ {label}</span>
        </div>
        <button
          className="absolute top-1 right-1 rounded-full p-1"
          style={{ backgroundColor: "rgba(26,31,27,0.7)" }}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <X className="w-3 h-3" style={{ color: "#F9F7F2" }} />
        </button>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <Camera className="w-6 h-6" style={{ color: "#86A383" }} />
        <span className="font-body" style={{ fontSize: "11px", color: "rgba(249,247,242,0.5)" }}>
          {label}
        </span>
        <span className="font-body" style={{ fontSize: "10px", color: "rgba(249,247,242,0.3)" }}>
          Tap to upload
        </span>
      </div>
    )}
  </div>
);

export default CookPhotoUpload;
