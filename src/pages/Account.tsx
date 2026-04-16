import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Pencil, Check, X } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import BottomNav from "@/components/BottomNav";

const Account = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savedAddress, setSavedAddress] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/account"); return; }
      setUserId(user.id);
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone || "");

      const { data: lastBooking } = await supabase
        .from("bookings")
        .select("address, phone")
        .eq("customer_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastBooking?.address) setSavedAddress(lastBooking.address);
      if (!user.user_metadata?.phone && lastBooking?.phone)
        setPhone(lastBooking.phone.replace("+971 ", "").replace(/\s/g, ""));
    })();
  }, [navigate]);

  const saveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
    setName(editName.trim());
    setEditingName(false);
    setSaving(false);
  };

  const savePhone = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { phone: editPhone.trim() } });
    setPhone(editPhone.trim());
    setEditingPhone(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const Field = ({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) => (
    <div className="py-3 border-b border-border last:border-0">
      <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      {children || <p className="font-body text-sm text-foreground">{value || "—"}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <nav className="flex items-center px-6 py-4">
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 flex-1 space-y-4">
        <h1 className="font-display italic text-2xl text-foreground">My Account</h1>

        <div className="bg-card rounded-xl border border-border px-5 divide-y divide-border" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Name */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Name</p>
              {!editingName && (
                <button onClick={() => { setEditName(name); setEditingName(true); }} className="text-primary">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingName ? (
              <div className="flex gap-2 mt-1">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={saveName} disabled={saving} className="p-2 rounded-lg bg-primary/10 text-primary"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="p-2 rounded-lg bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="font-body text-sm text-foreground">{name || "—"}</p>
            )}
          </div>

          {/* Email — read only */}
          <div className="py-3">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
            <p className="font-body text-sm text-foreground">{email}</p>
          </div>

          {/* Phone */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
              {!editingPhone && (
                <button onClick={() => { setEditPhone(phone); setEditingPhone(true); }} className="text-primary">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingPhone ? (
              <div className="flex gap-2 mt-1">
                <div className="flex flex-1">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted font-body text-sm text-muted-foreground">+971</span>
                  <input value={editPhone} onChange={e => setEditPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="50 123 4567"
                    className="flex-1 p-2 rounded-r-lg border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button onClick={savePhone} disabled={saving} className="p-2 rounded-lg bg-primary/10 text-primary"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingPhone(false)} className="p-2 rounded-lg bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="font-body text-sm text-foreground">{phone ? `+971 ${phone}` : "—"}</p>
            )}
          </div>

          {/* Saved address — read only, from last booking */}
          <div className="py-3">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Saved Address</p>
            <p className="font-body text-sm text-foreground">{savedAddress || "No address saved yet — complete a booking to save your address."}</p>
          </div>
        </div>

        <button onClick={handleSignOut}
          className="w-full py-4 rounded-xl border border-destructive/30 text-destructive font-body font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Account;
