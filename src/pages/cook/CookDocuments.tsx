import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCook } from "@/context/CookContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Check, Clock, Loader2 } from "lucide-react";
import CookBottomNav from "@/components/cook/CookBottomNav";

interface DocSlot {
  type: string;
  label: string;
  required: boolean;
}

const DOC_SLOTS: DocSlot[] = [
  { type: "emirates_id", label: "Emirates ID (front)", required: true },
  { type: "health_card", label: "Health Card / Food Handler Certificate", required: true },
  { type: "certification", label: "Additional Certification", required: false },
];

interface DocRecord {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  uploaded_at: string;
}

const CookDocuments = () => {
  const { cook } = useCook();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchDocs = async () => {
    if (!cook) return;
    const { data } = await supabase
      .from("cook_documents")
      .select("id, document_type, file_url, status, uploaded_at")
      .eq("cook_id", cook.id)
      .order("uploaded_at", { ascending: false });
    setDocs((data ?? []) as DocRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [cook]);

  const getDocForType = (type: string) => docs.find((d) => d.document_type === type);

  const handleUpload = async (type: string, file: File | null) => {
    if (!file || !cook) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Only JPG, PNG, WebP or PDF allowed", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File must be under 10MB", variant: "destructive" });
      return;
    }

    setUploadingType(type);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${cook.user_id}/${type}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("cook-documents")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast({ title: "Upload failed: " + uploadErr.message, variant: "destructive" });
      setUploadingType(null);
      return;
    }

    // Remove existing doc record for this type if exists
    const existing = getDocForType(type);
    if (existing) {
      await supabase.from("cook_documents").delete().eq("id", existing.id);
    }

    const { error: insertErr } = await supabase.from("cook_documents").insert({
      cook_id: cook.id,
      document_type: type,
      file_url: path,
      status: "uploaded",
    } as any);

    if (insertErr) {
      toast({ title: "Failed to save document", variant: "destructive" });
    } else {
      toast({ title: "Document uploaded ✓" });
      fetchDocs();
    }
    setUploadingType(null);
  };

  const statusIcon = (status: string) => {
    if (status === "verified") return <Check className="w-4 h-4" style={{ color: "#86A383" }} />;
    return <Clock className="w-4 h-4" style={{ color: "#B57E5D" }} />;
  };

  const statusLabel = (status: string) => {
    if (status === "verified") return "Verified ✓";
    return "Uploaded (pending review)";
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ backgroundColor: "#2D312E" }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" style={{ color: "#F9F7F2" }} />
        </button>
        <h1 className="font-display" style={{ fontSize: "20px", color: "#F9F7F2" }}>Documents</h1>
      </div>

      <p className="font-body mb-6" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
        Upload your verification documents. Our team reviews them within 48 hours.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ backgroundColor: "rgba(249,247,242,0.05)", height: "80px" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DOC_SLOTS.map((slot) => {
            const doc = getDocForType(slot.type);
            const isUploading = uploadingType === slot.type;

            return (
              <div
                key={slot.type}
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(249,247,242,0.05)", border: "1px solid rgba(134,163,131,0.18)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body font-semibold" style={{ fontSize: "14px", color: "#F9F7F2" }}>
                      {slot.label}
                    </p>
                    <p className="font-body mt-0.5" style={{ fontSize: "11px", color: "rgba(249,247,242,0.4)" }}>
                      {slot.required ? "Required" : "Optional"}
                    </p>
                  </div>
                  {doc && (
                    <div className="flex items-center gap-1">
                      {statusIcon(doc.status)}
                      <span className="font-body" style={{
                        fontSize: "11px",
                        color: doc.status === "verified" ? "#86A383" : "#B57E5D",
                      }}>
                        {statusLabel(doc.status)}
                      </span>
                    </div>
                  )}
                </div>

                {!doc && (
                  <p className="font-body mt-1" style={{ fontSize: "11px", color: "rgba(249,247,242,0.3)" }}>
                    Not uploaded
                  </p>
                )}

                <input
                  ref={(el) => { fileRefs.current[slot.type] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(slot.type, e.target.files?.[0] || null)}
                />

                <button
                  onClick={() => fileRefs.current[slot.type]?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 mt-3 rounded-lg px-4 py-2 font-body text-sm disabled:opacity-50"
                  style={{
                    backgroundColor: doc ? "transparent" : "rgba(134,163,131,0.15)",
                    border: doc ? "1px solid rgba(134,163,131,0.25)" : "none",
                    color: "#86A383",
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {doc ? "Re-upload" : "Upload"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.25)" }}>
        <p className="font-body" style={{ fontSize: "12px", color: "rgba(249,247,242,0.5)" }}>
          Documents are securely stored and only visible to the Cooq team. We verify them as part of your onboarding.
        </p>
      </div>

      <CookBottomNav />
    </div>
  );
};

export default CookDocuments;
