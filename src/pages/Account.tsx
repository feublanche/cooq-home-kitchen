import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";
import BottomNav from "@/components/BottomNav";

const Account = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/account-auth"); return; }
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <nav className="flex items-center px-6 py-4">
        <img src={cooqLogo} alt="Cooq" className="h-7" />
      </nav>

      <div className="px-6 flex-1">
        <h1 className="font-display italic text-2xl text-foreground mb-6">My Account</h1>

        <div className="bg-card rounded-xl border border-border p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          {name && (
            <div>
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Name</p>
              <p className="font-body text-base text-foreground mt-1">{name}</p>
            </div>
          )}
          <div>
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Email</p>
            <p className="font-body text-base text-foreground mt-1">{email}</p>
          </div>
        </div>

        <button onClick={handleSignOut}
          className="w-full mt-6 py-4 rounded-xl border border-destructive/30 text-destructive font-body font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Account;
