import { useEffect, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cooqLogo from "@/assets/cooq-logo.png";
import { toast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  UtensilsCrossed,
  ClipboardCheck,
  AlertTriangle,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Search,
  
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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
  proof_notes?: string | null;
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
  doc_notes?: string | null;
  photo_url?: string | null;
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
  admin_notes: string | null;
  created_at: string | null;
  photo_urls: string[] | null;
}

const tabs = [
  { id: "supply", label: "Supply Manager", icon: ShieldCheck },
  { id: "vetting", label: "Menu Vetting", icon: UtensilsCrossed },
  { id: "quality", label: "Quality Audit", icon: ClipboardCheck },
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
  needs_review: "bg-amber-500/10 text-amber-500",
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

const docStatusBadge = (status: string) => {
  switch (status) {
    case "verified": return <span className="font-body text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified ✓</span>;
    case "needs_resubmission": return <span className="font-body text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Resubmission Requested 🟠</span>;
    default: return <span className="font-body text-xs font-semibold text-copper bg-copper/10 px-2 py-0.5 rounded-full">Uploaded</span>;
  }
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

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [requestChangesDialog, setRequestChangesDialog] = useState(false);
  const [requestChangesText, setRequestChangesText] = useState("");

  // Image lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Menu vetting state
  const [menuActionMode, setMenuActionMode] = useState<Record<string, "approve" | "changes" | "reject" | null>>({});
  const [menuPhotoFile, setMenuPhotoFile] = useState<File | null>(null);
  const [menuActionNote, setMenuActionNote] = useState<Record<string, string>>({});
  const [menuActionLoading, setMenuActionLoading] = useState<string | null>(null);

  // Cook documents state
  const [cookDocs, setCookDocs] = useState<{ id: string; cook_id: string; document_type: string; file_url: string; status: string }[]>([]);
  const [docSignedUrls, setDocSignedUrls] = useState<Record<string, string>>({});
  const [docResubMode, setDocResubMode] = useState<string | null>(null);
  const [docResubNote, setDocResubNote] = useState("");
  
  const [proofResubMode, setProofResubMode] = useState<string | null>(null);
  const [proofResubNote, setProofResubNote] = useState("");

  // OneSignal delay
  const [showOneSignal, setShowOneSignal] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowOneSignal(true), 5000);
    return () => clearTimeout(timer);
  }, []);

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
      .select("id, name, email, phone, cuisine, area, years_experience, health_card, visa_type, status, created_at, bio, operator_notes, photo_url")
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

  const notifyCookGeneric = async (cookName: string, cookEmail: string, cookPhone: string | null, eventType: string, details: Record<string, any>) => {
    try {
      await supabase.functions.invoke("notify-cook", {
        body: { cook_name: cookName, cook_email: cookEmail, cook_phone: cookPhone, event_type: eventType, booking_details: details },
      });
    } catch (err) { console.error("Notification failed:", err); }
  };

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
      .update({ cook_id: cook.id, cook_name: cook.name, cook_email: cook.email, cook_phone: cook.phone })
      .eq("id", assignBooking.id);
    await notifyCookGeneric(cook.name, cook.email, cook.phone, "new_booking", {
      menu: assignBooking.menu_selected, date: assignBooking.booking_date, customer_name: assignBooking.customer_name, area: assignBooking.area,
    });
    toast({ title: "Cook assigned and notified ✓" });
    setAssignDrawerOpen(false);
    setAssigning(false);
    fetchBookings();
  };

  const updateCookStatus = async (cookId: string, newStatus: string, notes?: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };
    if (notes !== undefined) updateData.operator_notes = notes;
    setCooks((prev) => prev.map((c) => (c.id === cookId ? { ...c, status: newStatus, operator_notes: notes ?? c.operator_notes } : c)));
    if (selectedCook && selectedCook.id === cookId) {
      setSelectedCook({ ...selectedCook, status: newStatus, operator_notes: notes ?? selectedCook.operator_notes });
    }
    await supabase.from("cooks").update(updateData as any).eq("id", cookId);
    toast({ title: `Cook status updated to "${newStatus}" ✓` });
  };

  // ── Cook Drawer Actions ──
  const openCookDrawer = async (cook: CookRecord) => {
    setSelectedCook(cook);
    setDocResubMode(null);
    setDocResubMode(null);
    setDocResubNote("");
    const { data } = await supabase
      .from("cook_documents")
      .select("id, cook_id, document_type, file_url, status")
      .eq("cook_id", cook.id);
    const docs = (data ?? []) as any;
    setCookDocs(docs);
    const urlMap: Record<string, string> = {};
    for (const doc of docs) {
      if (doc.file_url) {
        const path = doc.file_url.includes("cook-documents/") ? doc.file_url.split("cook-documents/")[1] : doc.file_url;
        const { data: signedData } = await supabase.storage.from("cook-documents").createSignedUrl(path, 3600);
        if (signedData?.signedUrl) urlMap[doc.id] = signedData.signedUrl;
      }
    }
    setDocSignedUrls(urlMap);
  };

  const handleApproveCook = () => {
    if (!selectedCook) return;
    setConfirmDialog({
      open: true,
      title: `Approve ${selectedCook.name}?`,
      description: "This cook's documents will be marked as approved. They will still need an approved menu before appearing in customer search.",
      onConfirm: async () => {
        await updateCookStatus(selectedCook.id, "approved");
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleUndoApproval = () => {
    if (!selectedCook) return;
    setConfirmDialog({
      open: true,
      title: `Undo approval for ${selectedCook.name}?`,
      description: "This will revert the cook's status to Pending.",
      onConfirm: async () => {
        await updateCookStatus(selectedCook.id, "pending");
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleRequestChangesOpen = () => {
    setRequestChangesText("");
    setRequestChangesDialog(true);
  };

  const handleRequestChangesSend = async () => {
    if (!selectedCook || !requestChangesText.trim()) return;
    await updateCookStatus(selectedCook.id, "needs_review", requestChangesText.trim());
    setRequestChangesDialog(false);
    setRequestChangesText("");
  };

  const handleSuspendCook = () => {
    if (!selectedCook) return;
    setConfirmDialog({
      open: true,
      title: `Suspend ${selectedCook.name}?`,
      description: "This cook will be suspended and removed from active listings.",
      onConfirm: async () => {
        await updateCookStatus(selectedCook.id, "suspended");
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleRejectCook = () => {
    if (!selectedCook) return;
    setConfirmDialog({
      open: true,
      title: `Reject ${selectedCook.name}?`,
      description: "This is a permanent action. The cook will be removed from the platform.",
      onConfirm: async () => {
        await updateCookStatus(selectedCook.id, "rejected");
        setCooks((prev) => prev.filter((c) => c.id !== selectedCook.id));
        setSelectedCook(null);
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };

  const handleVerifyDocument = async (docId: string) => {
    await supabase.from("cook_documents").update({ status: "verified" } as any).eq("id", docId);
    setCookDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "verified" } : d));
    toast({ title: "Document verified ✓" });
  };

  const handleDocResubmission = async (docId: string, cookId: string) => {
    if (!docResubNote.trim()) { toast({ title: "Please provide a reason", variant: "destructive" }); return; }
    await supabase.from("cook_documents").update({ status: "needs_resubmission" } as any).eq("id", docId);
    await supabase.from("cooks").update({ doc_notes: docResubNote.trim() } as any).eq("id", cookId);
    setCookDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "needs_resubmission" } : d));
    toast({ title: "Resubmission requested" });
    setDocResubMode(null);
    setDocResubNote("");
  };

  const notifyOperator = async (event_type: string, details: Record<string, any>) => {
    try {
      await supabase.functions.invoke("notify-operator", { body: { event_type, details } });
    } catch (err) { console.error("Operator notification failed:", err); }
  };

  const handleProofApprove = async (bookingId: string) => {
    await supabase.from("bookings").update({ proof_status: "approved", status: "completed" } as any).eq("id", bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, proof_status: "approved", status: "completed" } : b));
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const cook = cooks.find((c) => c.id === booking.cook_id);
      if (cook) await notifyCookGeneric(cook.name, cook.email, cook.phone, "proof_approved", { date: booking.booking_date });
      await notifyOperator("proof_approved", { cook_name: booking.cook_name, date: booking.booking_date });
    }
    toast({ title: "Proof approved ✓" });
  };

  const handleProofResubmit = async (bookingId: string, notes: string) => {
    if (!notes.trim()) { toast({ title: "Please provide a reason", variant: "destructive" }); return; }
    await supabase.from("bookings").update({ proof_status: "resubmit", proof_notes: notes.trim() } as any).eq("id", bookingId);
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, proof_status: "resubmit", proof_notes: notes.trim() } : b));
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const cook = cooks.find((c) => c.id === booking.cook_id);
      if (cook) await notifyCookGeneric(cook.name, cook.email, cook.phone, "proof_resubmit", { date: booking.booking_date, notes: notes.trim() });
    }
    toast({ title: "Resubmission requested" });
    setProofResubMode(null);
    setProofResubNote("");
  };

  // ── Menu Vetting Actions ──
  const handleMenuApprove = async (menu: MenuRecord) => {
    setMenuActionLoading(menu.id);
    try {
      await supabase.from("cook_menus").update({ status: "approved" } as any).eq("id", menu.id);
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, status: "approved" } : m)));
      if (menu.cook_id) {
        const cook = cooks.find((c) => c.id === menu.cook_id);
        if (cook) await notifyCookGeneric(cook.name, cook.email, cook.phone, "menu_approved", { menu: menu.menu_name });
      }
      toast({ title: "Menu Approved ✓" });
    } catch (err: any) {
      toast({ title: "Error: " + (err.message || "Failed"), variant: "destructive" });
    }
    setMenuActionLoading(null);
    setMenuActionMode((prev) => ({ ...prev, [menu.id]: null }));
  };

  const handleMenuUploadPhoto = async (menu: MenuRecord) => {
    if (!menuPhotoFile) { toast({ title: "Please select a photo first", variant: "destructive" }); return; }
    setMenuActionLoading(menu.id);
    try {
      const ext = menuPhotoFile.name.split(".").pop() || "jpg";
      const path = `${menu.id}/photo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("menu-photos").upload(path, menuPhotoFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("menu-photos").getPublicUrl(path);
      const photoUrl = urlData.publicUrl;
      await supabase.from("cook_menus").update({ photo_urls: [photoUrl] } as any).eq("id", menu.id);
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, photo_urls: [photoUrl] } : m)));
      toast({ title: "Photo uploaded ✓" });
    } catch (err: any) {
      toast({ title: "Error: " + (err.message || "Upload failed"), variant: "destructive" });
    }
    setMenuActionLoading(null);
    setMenuPhotoFile(null);
    setMenuActionMode((prev) => ({ ...prev, [menu.id]: null }));
  };

  const handleMenuRequestChanges = async (menu: MenuRecord) => {
    const note = menuActionNote[menu.id]?.trim();
    if (!note) { toast({ title: "Please describe what needs to change", variant: "destructive" }); return; }
    setMenuActionLoading(menu.id);
    await supabase.from("cook_menus").update({ status: "needs_review", admin_notes: note } as any).eq("id", menu.id);
    setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, status: "needs_review", admin_notes: note } : m)));
    if (menu.cook_id) {
      const cook = cooks.find((c) => c.id === menu.cook_id);
      if (cook) await notifyCookGeneric(cook.name, cook.email, cook.phone, "menu_rejected", { menu: menu.menu_name });
    }
    toast({ title: "Changes requested" });
    setMenuActionLoading(null);
    setMenuActionMode((prev) => ({ ...prev, [menu.id]: null }));
    setMenuActionNote((prev) => ({ ...prev, [menu.id]: "" }));
  };

  const handleMenuRejectFinal = async (menu: MenuRecord) => {
    const note = menuActionNote[menu.id]?.trim();
    if (!note) { toast({ title: "Please provide a reason", variant: "destructive" }); return; }
    setMenuActionLoading(menu.id);
    await supabase.from("cook_menus").update({ status: "rejected", admin_notes: note } as any).eq("id", menu.id);
    setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, status: "rejected", admin_notes: note } : m)));
    toast({ title: "Menu rejected" });
    setMenuActionLoading(null);
    setMenuActionMode((prev) => ({ ...prev, [menu.id]: null }));
    setMenuActionNote((prev) => ({ ...prev, [menu.id]: "" }));
  };

  // Supply search filter
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.customer_name?.toLowerCase().includes(q) || b.cook_name?.toLowerCase().includes(q) || b.area?.toLowerCase().includes(q);
  });

  // Menu vetting: only show menus from cooks with status='approved' or 'active'
  const approvedCookIds = new Set(cooks.filter((c) => c.status === "approved" || c.status === "active").map((c) => c.id));
  const vettableMenus = menus.filter((m) => m.cook_id && approvedCookIds.has(m.cook_id));

  return (
    <div className="min-h-screen bg-background">
      {showOneSignal && <div className="onesignal-customlink-container mx-4 mt-2 mb-2" style={{ minHeight: "44px" }}></div>}

      {/* Header */}
      <div className="bg-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-background"><ArrowLeft className="w-5 h-5" /></button>
          <img src={cooqLogo} alt="Cooq" className="h-6 brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-background/70 uppercase tracking-wider">Operator Dashboard</span>
          <a href="/cook-agreement" target="_blank" className="text-xs text-gray-400 underline hover:text-gray-600">Cook Agreement</a>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/operator/login"); }} className="text-background/70 hover:text-background transition-colors">
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex flex-col items-center gap-1 px-4 py-3 font-body text-[10px] font-medium transition-colors whitespace-nowrap border-b-2 ${isActive ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {tab.id === "supply" && cooks.filter(c => c.status === "applied" || c.status === "pending").length > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                      {cooks.filter(c => c.status === "applied" || c.status === "pending").length}
                    </span>
                  )}
                  {tab.id === "vetting" && menus.filter(m => m.status === "pending").length > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                      {menus.filter(m => m.status === "pending").length}
                    </span>
                  )}
                  {tab.id === "quality" && bookings.filter(b => b.proof_status === "pending_review").length > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                      {bookings.filter(b => b.proof_status === "pending_review").length}
                    </span>
                  )}
                </div>
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
            <p className="font-body text-xs text-muted-foreground mb-4">Step 1: Review & approve cook applications (Visa/EID). Approved cooks proceed to Menu Vetting.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Pending" value={cooks.filter((c) => c.status === "applied" || c.status === "pending").length} />
              <StatCard label="Active Cooks" value={cooks.filter((c) => c.status === "approved" || c.status === "active").length} />
              <StatCard label="Total Cooks" value={cooks.length} />
            </div>
            {(() => {
              const confirmedNoPhoto = bookings.filter((b) => b.status === "confirmed" && !photos.some((p) => p.booking_id === b.id));
              const completedNoPhoto = bookings.filter((b) => b.status === "completed" && !photos.some((p) => p.booking_id === b.id));
              const alerts: { icon: React.ReactNode; text: string }[] = [];
              if (confirmedNoPhoto.length > 0) alerts.push({ icon: <AlertTriangle className="w-4 h-4 text-copper" />, text: `${confirmedNoPhoto.length} confirmed booking(s) missing proof photos` });
              if (completedNoPhoto.length > 0) alerts.push({ icon: <AlertTriangle className="w-4 h-4 text-copper" />, text: `${completedNoPhoto.length} completed booking(s) with no proof photos uploaded` });
              if (expiringCooks.length > 0) alerts.push({ icon: <AlertTriangle className="w-4 h-4 text-copper" />, text: `${expiringCooks.length} cook(s) with DHA health cards expiring within 30 days` });
            if (cookDocs.filter(d => d.status === "uploaded").length > 0) alerts.push({ icon: <AlertTriangle className="w-4 h-4 text-copper" />, text: `${cookDocs.filter(d => d.status === "uploaded").length} document(s) awaiting your review — check Supply Manager` });
              return (
                <div className="bg-card rounded-xl p-4 border border-border mb-4" style={{ boxShadow: "var(--shadow-card)" }}>
                  <p className="font-body text-sm font-semibold text-foreground mb-2">Alerts</p>
                  <div className="space-y-2">
                    {alerts.length > 0 ? alerts.map((a, i) => <AlertItem key={i} icon={a.icon} text={a.text} />) : <AlertItem icon={<CheckCircle2 className="w-4 h-4 text-primary" />} text="No alerts — everything looks good ✓" />}
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setSupplyView("bookings")} className={`px-4 py-2 rounded-lg font-body text-xs font-semibold transition-colors ${supplyView === "bookings" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>Bookings</button>
              <button type="button" onClick={() => setSupplyView("cooks")} className={`px-4 py-2 rounded-lg font-body text-xs font-semibold transition-colors ${supplyView === "cooks" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>Cooks</button>
            </div>

            {supplyView === "bookings" && (
              <>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search customer, cook, area..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
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
                              <p className="font-body text-xs text-muted-foreground">{b.area || "—"} · {b.booking_date || "No date"}</p>
                            </div>
                            <select value={b.status} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); updateStatus(b.id, e.target.value); }} className={`font-body text-xs font-semibold px-2 py-1 rounded-lg border-0 ${statusColors[b.status] || ""}`}>
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
                              <button onClick={(e) => { e.stopPropagation(); openAssignDrawer(b); }} className="font-body text-[10px] font-semibold px-2 py-1 rounded-lg bg-copper/10 text-copper hover:bg-copper/20 transition-colors">Assign Cook</button>
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
                  {filteredBookings.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-8">No bookings found</p>}
                </div>
              </>
            )}

            {supplyView === "cooks" && (
              <div className="space-y-3">
                {cooks.filter((c) => c.status !== "rejected").map((c) => (
                  <button type="button" key={c.id} onClick={() => openCookDrawer(c)} className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary/40 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{c.email} · {c.phone || "—"}</p>
                      </div>
                      <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${cookStatusColors[c.status || "applied"] || ""}`}>{c.status || "applied"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.cuisine?.map((cu) => (
                        <span key={cu} className="font-body text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cu}</span>
                      )) || <span className="font-body text-xs text-muted-foreground">—</span>}
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">{c.area || "—"} · {c.years_experience ?? 0}y exp</p>
                  </button>
                ))}
                {cooks.filter((c) => c.status !== "rejected").length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-8">No cooks registered</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Menu Vetting Queue ── */}
        {activeTab === "vetting" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Menu Vetting Queue</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">Step 2: Only cooks with approved documents appear here. Approving a menu makes the cook visible to customers.</p>
            <div className="space-y-3">
              {vettableMenus.map((m) => {
                const ms = m.status || "pending_review";
                const mode = menuActionMode[m.id] || null;
                return (
                  <div key={m.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{m.cook_name}</p>
                        <p className="font-body text-xs text-foreground">{m.menu_name}</p>
                        <p className="font-body text-xs text-copper mt-0.5">{m.cuisine || "—"}</p>
                      </div>
                      <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${menuStatusColors[ms] || ""}`}>
                        {ms === "pending_review" ? "Pending" : ms === "approved" ? "Approved" : ms === "needs_review" ? "Changes Requested" : ms === "rejected" ? "Rejected" : ms}
                      </span>
                    </div>
                    {m.meals && m.meals.length > 0 && (
                      <div className="mb-2">
                        {m.meals.map((meal, i) => <p key={i} className="font-body text-xs text-foreground">{i + 1}. {meal}</p>)}
                      </div>
                    )}
                    {m.dietary && m.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {m.dietary.map((d) => <span key={d} className="font-body text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{d}</span>)}
                      </div>
                    )}
                    {m.photo_urls && m.photo_urls.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {m.photo_urls.map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />)}
                      </div>
                    )}
                    {(ms === "needs_review" || ms === "rejected") && m.admin_notes && (
                      <p className="font-body text-xs text-destructive/70 italic mt-1">Notes: {m.admin_notes}</p>
                    )}
                    {!mode && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: "approve" }))} className="flex-1 py-2 rounded-lg font-body text-xs font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">Approve</button>
                        <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: "changes" }))} className="flex-1 py-2 rounded-lg font-body text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">Request Changes</button>
                        <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: "reject" }))} className="flex-1 py-2 rounded-lg font-body text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">Reject</button>
                      </div>
                    )}
                    {mode === "approve" && (
                      <div className="mt-3 space-y-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="font-body text-xs font-semibold text-green-700">Approve this menu? The cook will become visible to customers.</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleMenuApprove(m)} disabled={menuActionLoading === m.id} className="px-4 py-2 rounded-lg font-body text-xs font-semibold bg-green-500 text-white disabled:opacity-50 flex items-center gap-1">
                            {menuActionLoading === m.id && <Loader2 className="w-3 h-3 animate-spin" />} Approve
                          </button>
                          <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: null }))} className="px-3 py-2 rounded-lg font-body text-xs text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    )}
                    {(ms === "approved" || ms === "pending_review") && (!m.photo_urls || m.photo_urls.length === 0) && !mode && (
                      <div className="mt-3 space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="font-body text-xs font-semibold text-blue-700">Add food photo (optional)</p>
                        <input type="file" accept="image/*" onChange={(e) => setMenuPhotoFile(e.target.files?.[0] || null)} className="font-body text-xs" />
                        {menuPhotoFile && (
                          <button onClick={() => handleMenuUploadPhoto(m)} disabled={menuActionLoading === m.id} className="px-4 py-2 rounded-lg font-body text-xs font-semibold bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1">
                            {menuActionLoading === m.id && <Loader2 className="w-3 h-3 animate-spin" />} Upload Photo
                          </button>
                        )}
                      </div>
                    )}
                    {mode === "changes" && (
                      <div className="mt-3 space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <textarea value={menuActionNote[m.id] || ""} onChange={(e) => setMenuActionNote((p) => ({ ...p, [m.id]: e.target.value }))} placeholder="What needs to change?" className="w-full p-2 rounded-lg border border-amber-300 bg-white font-body text-xs text-foreground resize-none outline-none" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleMenuRequestChanges(m)} disabled={menuActionLoading === m.id} className="px-4 py-2 rounded-lg font-body text-xs font-semibold bg-amber-500 text-white disabled:opacity-50 flex items-center gap-1">
                            {menuActionLoading === m.id && <Loader2 className="w-3 h-3 animate-spin" />} Send Feedback
                          </button>
                          <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: null }))} className="px-3 py-2 rounded-lg font-body text-xs text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    )}
                    {mode === "reject" && (
                      <div className="mt-3 space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
                        <textarea value={menuActionNote[m.id] || ""} onChange={(e) => setMenuActionNote((p) => ({ ...p, [m.id]: e.target.value }))} placeholder="Reason for rejection..." className="w-full p-2 rounded-lg border border-red-300 bg-white font-body text-xs text-foreground resize-none outline-none" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleMenuRejectFinal(m)} disabled={menuActionLoading === m.id} className="px-4 py-2 rounded-lg font-body text-xs font-semibold bg-destructive text-white disabled:opacity-50 flex items-center gap-1">
                            {menuActionLoading === m.id && <Loader2 className="w-3 h-3 animate-spin" />} Reject Menu
                          </button>
                          <button onClick={() => setMenuActionMode((p) => ({ ...p, [m.id]: null }))} className="px-3 py-2 rounded-lg font-body text-xs text-muted-foreground">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {vettableMenus.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-8">No menus from approved cooks to review.</p>}
            </div>
          </div>
        )}

        {/* ── Quality Audit ── */}
        {activeTab === "quality" && (
          <div>
            <h2 className="font-display text-xl text-foreground mb-1">Quality Audit</h2>
            <p className="font-body text-xs text-muted-foreground mb-4">Review proof photos uploaded by cooks after sessions</p>
            {(() => {
              const proofBookings = bookings.filter((b) => b.proof_status === "pending_review");
              return proofBookings.length === 0 ? (
                <div className="bg-card rounded-xl p-6 border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                  <Camera className="w-10 h-10 text-copper mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">No proof photos pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proofBookings.map((b) => {
                    const bPhotos = photos.filter((p) => p.booking_id === b.id);
                    return (
                      <div key={b.id} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-body text-sm font-semibold text-foreground">{b.cook_name}</p>
                            <p className="font-body text-xs text-muted-foreground">{b.customer_name} · {b.booking_date || "—"}</p>
                          </div>
                          <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-copper/10 text-copper">Pending Review</span>
                        </div>
                        {bPhotos.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {bPhotos.map((p) => (
                              <div key={p.id} className="relative rounded-lg overflow-hidden aspect-square bg-muted">
                                <img src={p.photo_url} alt={p.photo_type} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 px-2 py-1">
                                  <p className="font-body text-[10px] text-background capitalize">{p.photo_type.replace("_", " ")}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {proofResubMode !== b.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleProofApprove(b.id)} className="flex-1 py-2 rounded-lg font-body text-xs font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">Approve ✓</button>
                            <button onClick={() => { setProofResubMode(b.id); setProofResubNote(""); }} className="flex-1 py-2 rounded-lg font-body text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">Request Resubmission</button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <textarea value={proofResubNote} onChange={(e) => setProofResubNote(e.target.value)} placeholder="What needs to be re-uploaded?" className="w-full p-2 rounded-lg border border-amber-300 bg-white font-body text-xs text-foreground resize-none outline-none" rows={2} />
                            <div className="flex gap-2">
                              <button onClick={() => handleProofResubmit(b.id, proofResubNote)} disabled={!proofResubNote.trim()} className="px-4 py-2 rounded-lg font-body text-xs font-semibold bg-amber-500 text-white disabled:opacity-50">Send</button>
                              <button onClick={() => setProofResubMode(null)} className="px-3 py-2 rounded-lg font-body text-xs text-muted-foreground">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Cook Detail Page */}
      {selectedCook && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-4 py-6 pb-28">
            {/* Back button */}
            <button type="button" onClick={() => setSelectedCook(null)} className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to cooks
            </button>

            {/* Card */}
            <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              {/* HEADER */}
              <div className="flex items-center gap-4 mb-6">
                {selectedCook.photo_url ? (
                  <img src={`${selectedCook.photo_url}?t=${Date.now()}`} alt={selectedCook.name} className="w-20 h-20 rounded-full object-cover border-2 border-border shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(134,163,131,0.15)" }}>
                    <span className="font-display text-xl" style={{ color: "#86A383" }}>
                      {selectedCook.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl text-foreground">{selectedCook.name}</h2>
                    <span className={`font-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                      selectedCook.status === "approved" || selectedCook.status === "active" ? "bg-green-100 text-green-700" :
                      selectedCook.status === "suspended" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {selectedCook.status || "applied"}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mt-0.5">{selectedCook.email}</p>
                  <p className="font-body text-sm text-muted-foreground">{selectedCook.phone || "—"}</p>
                </div>
              </div>

              <hr className="border-border mb-5" />

              {/* INFO SECTION */}
              <div className="space-y-3 mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-xs text-muted-foreground w-24 shrink-0">Area</span>
                  <span className="font-body text-sm text-foreground">{selectedCook.area || "—"}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-xs text-muted-foreground w-24 shrink-0">Experience</span>
                  <span className="font-body text-sm text-foreground">{selectedCook.years_experience ?? 0} years</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-xs text-muted-foreground w-24 shrink-0">Applied</span>
                  <span className="font-body text-sm text-foreground">{selectedCook.created_at ? new Date(selectedCook.created_at).toLocaleDateString("en-GB") : "—"}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-body text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Cuisines</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCook.cuisine && selectedCook.cuisine.length > 0 ? selectedCook.cuisine.map((cu) => (
                      <span key={cu} className="font-body text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{cu}</span>
                    )) : <span className="font-body text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedCook.bio && (
                <>
                  <p className="font-body text-xs text-muted-foreground mb-1.5">Bio</p>
                  <div className="bg-muted/40 rounded-lg p-4 mb-5">
                    <p className="font-body text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedCook.bio}</p>
                  </div>
                </>
              )}

              {/* Operator Notes */}
              {selectedCook.operator_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                  <p className="font-body text-xs font-semibold text-amber-800 mb-1">Operator Notes</p>
                  <p className="font-body text-sm text-amber-700">{selectedCook.operator_notes}</p>
                </div>
              )}

              <hr className="border-border mb-5" />

              {/* DOCUMENTS SECTION */}
              {cookDocs.length > 0 && (
                <div>
                  <h3 className="font-display text-base text-foreground mb-3">Documents</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cookDocs.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                        {docSignedUrls[doc.id] && (
                          <button type="button" onClick={() => setLightboxUrl(docSignedUrls[doc.id])} className="block w-full bg-muted/20 p-2">
                            <img src={docSignedUrls[doc.id]} alt={doc.document_type} className="mx-auto object-contain rounded" style={{ maxWidth: "180px", maxHeight: "180px" }} />
                          </button>
                        )}
                        <div className="p-3 space-y-2">
                          <p className="font-body text-xs font-semibold text-foreground">
                            {{ emirates_id_front: "Emirates ID (Front)", emirates_id_back: "Emirates ID (Back)", health_card: "Health Card" }[doc.document_type] || doc.document_type.replace(/_/g, " ")}
                          </p>
                          {docStatusBadge(doc.status)}
                          {doc.status !== "needs_resubmission" && docResubMode !== doc.id && (
                            <div className="flex gap-2 pt-1">
                             {doc.status !== "verified" && <button onClick={() => handleVerifyDocument(doc.id)} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">Verify ✓</button>}
                              <button onClick={() => { setDocResubMode(doc.id); setDocResubNote(""); }} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">Resubmit</button>
                            </div>
                          )}
                          {docResubMode === doc.id && (
                            <div className="space-y-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                              <textarea value={docResubNote} onChange={(e) => setDocResubNote(e.target.value)} placeholder="What's wrong with this document?" className="w-full p-2 rounded-lg border border-amber-300 bg-white font-body text-xs text-foreground resize-none outline-none" rows={2} />
                              <div className="flex gap-2">
                                <button onClick={() => handleDocResubmission(doc.id, doc.cook_id)} disabled={!docResubNote.trim()} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-semibold bg-amber-500 text-white disabled:opacity-50">Send</button>
                                <button onClick={() => setDocResubMode(null)} className="px-3 py-1.5 rounded-lg font-body text-[11px] text-muted-foreground">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FIXED BOTTOM BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
            <div className="max-w-[700px] mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
              {selectedCook.status === "approved" ? (
                <>
                  <button type="button" onClick={handleUndoApproval} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">Undo Approval</button>
                  <button type="button" onClick={handleRequestChangesOpen} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors">Request Changes</button>
                  <button type="button" onClick={handleSuspendCook} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Suspend</button>
                </>
              ) : selectedCook.status === "suspended" ? (
                <>
                  <button type="button" onClick={handleApproveCook} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors">Re-approve</button>
                  <button type="button" onClick={handleRejectCook} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">Reject</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleApproveCook} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors">Approve ✓</button>
                  <button type="button" onClick={handleRequestChangesOpen} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors">Request Changes</button>
                  <button type="button" onClick={handleSuspendCook} className="px-4 py-2.5 rounded-xl font-body font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Suspend</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Cook Drawer */}
      <Drawer open={assignDrawerOpen} onOpenChange={setAssignDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg">Assign a Cook — {assignBooking?.customer_name}</DrawerTitle>
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
                <button key={c.id} onClick={() => setSelectedCookId(c.id)} className={`w-full text-left rounded-xl p-3 border transition-colors ${selectedCookId === c.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <p className="font-body text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{c.cuisine?.join(" · ") || "—"} · {c.area || "—"} · {c.years_experience ?? 0}y</p>
                </button>
              ))}
              {availableCooks.length === 0 && <p className="font-body text-sm text-muted-foreground text-center py-4">No approved cooks available</p>}
            </div>
            <button onClick={confirmAssignment} disabled={!selectedCookId || assigning} className="w-full mt-4 py-3 rounded-xl font-body font-semibold text-sm text-background bg-copper hover:bg-copper/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Assignment
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) setConfirmDialog((p) => ({ ...p, open: false })); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Changes Dialog */}
      <Dialog open={requestChangesDialog} onOpenChange={setRequestChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes — {selectedCook?.name}</DialogTitle>
          </DialogHeader>
          <textarea
            value={requestChangesText}
            onChange={(e) => setRequestChangesText(e.target.value)}
            placeholder="Describe what the cook needs to change..."
            className="w-full rounded-xl border border-border bg-card p-3 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary min-h-[100px]"
          />
          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-lg font-body text-sm text-muted-foreground">Cancel</button>
            </DialogClose>
            <button onClick={handleRequestChangesSend} disabled={!requestChangesText.trim()} className="px-4 py-2 rounded-lg font-body text-sm font-semibold bg-amber-500 text-white disabled:opacity-50">Send Feedback</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <Dialog open={true} onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
            <img src={lightboxUrl} alt="Document" className="w-full h-auto max-h-[85vh] object-contain" />
          </DialogContent>
        </Dialog>
      )}
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
