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
  description: string;
}

const DOC_SLOTS: DocSlot[] = [
  { type: "emirates_id", label: "Emirates ID (front)", description: "Upload a photo of your Emirates ID (front side)" },
  { type: "health_card", label: "Health Card / Food Safety Certificate", description: "Upload your DHA health card or food handler certificate" },
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

  const isPending = cook?.status === "pending" || cook?.status === "applied";

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
    const path = `${cook.id}/${type}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("cook-documents")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast({ title: "Upload failed: " + uploadErr.message, variant: "destructive" });
      setUploadingType(null);
      return;
    }

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
      toast({ title: "Uploaded — under review ✓" });

      // Notify operator
      try {
        await supabase.functions.invoke("notify-cook", {
          body: {
            cook_name: cook.name,
            cook_email: cook.email,
            event_type: "document_uploaded",
            booking_details: { document_type: type },
          },
        });
      } catch (e) { console.log("Notification skipped:", e); }

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
    return "Uploaded — under review";
  };

  const statusColor = (status: string) => status === "verified" ? "#86A383" : "#B57E5D";

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/cook/dashboard")}>
          <ArrowLeft className="w-5 h-5" style={{ color: "#2C3B3A" }} />
        </button>
        <h1 className="font-display" style={{ fontSize: "20px", color: "#2C3B3A" }}>Documents</h1>
      </div>

      {isPending && (
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(134,163,131,0.08)", border: "1px solid rgba(134,163,131,0.15)" }}>
          <p className="font-body text-xs" style={{ color: "#86A383" }}>
            Upload your documents now to speed up your approval.
          </p>
        </div>
      )}

      <p className="font-body mb-6" style={{ fontSize: "12px", color: "#999" }}>
        Upload your verification documents. Our team reviews them within 48 hours.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl animate-pulse bg-white border border-gray-100" style={{ height: "100px" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DOC_SLOTS.map((slot) => {
            const doc = getDocForType(slot.type);
            const isUploading = uploadingType === slot.type;

            return (
              <div key={slot.type} className="rounded-xl p-4 bg-white border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-body font-semibold" style={{ fontSize: "14px", color: "#2C3B3A" }}>{slot.label}</p>
                    <p className="font-body mt-1" style={{ fontSize: "11px", color: "#999" }}>{slot.description}</p>
                  </div>
                  {doc && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {statusIcon(doc.status)}
                      <span className="font-body" style={{ fontSize: "11px", color: statusColor(doc.status) }}>
                        {statusLabel(doc.status)}
                      </span>
                    </div>
                  )}
                </div>

                {!doc && (
                  <p className="font-body mt-1" style={{ fontSize: "11px", color: "#ccc" }}>Not uploaded</p>
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
                    backgroundColor: doc ? "transparent" : "rgba(134,163,131,0.1)",
                    border: doc ? "1px solid rgba(134,163,131,0.2)" : "none",
                    color: "#86A383",
                  }}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {doc ? "Re-upload" : "Upload"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: "rgba(134,163,131,0.06)", border: "1px solid rgba(134,163,131,0.15)" }}>
        <p className="font-body" style={{ fontSize: "12px", color: "#999" }}>
          Documents are securely stored and only visible to the Cooq team. We verify them as part of your onboarding.
        </p>
      </div>

      <CookBottomNav />
    </div>
  );
};

export default CookDocuments;
