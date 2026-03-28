import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ClipboardList, label: "My Bookings", path: "/bookings", authRequired: true },
  { icon: User, label: "Account", path: "/account-page", authRequired: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const visibleTabs = isLoggedIn ? tabs : tabs.filter(t => !t.authRequired);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-16" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.path === "/" && location.pathname === "/");
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5">
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-body text-[10px] ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
