import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, User } from "lucide-react";
import { useCook } from "@/context/CookContext";

interface CookBottomNavProps {
  pendingCount?: number;
}

const tabs = [
  { icon: LayoutDashboard, label: "Home", path: "/cook/dashboard" },
  { icon: ClipboardList, label: "Orders", path: "/cook/orders" },
  { icon: UtensilsCrossed, label: "Menus", path: "/cook/menus" },
  { icon: User, label: "Profile", path: "/cook/profile" },
];

const CookBottomNav = ({ pendingCount = 0 }: CookBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cook } = useCook();

  // Only show for approved/active cooks
  if (!cook || (cook.status !== "approved" && cook.status !== "active")) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            style={
              isActive
                ? { backgroundColor: "rgba(134,163,131,0.1)", borderRadius: "8px", padding: "4px 12px" }
                : { padding: "4px 12px" }
            }
          >
            <div className="relative">
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? "#86A383" : "rgba(45,49,46,0.4)" }}
              />
              {tab.label === "Orders" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
            <span
              className="font-body"
              style={{
                fontSize: "10px",
                color: isActive ? "#86A383" : "rgba(45,49,46,0.4)",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CookBottomNav;
