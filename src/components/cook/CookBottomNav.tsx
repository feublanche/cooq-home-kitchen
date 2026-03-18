import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Camera, DollarSign, CalendarDays } from "lucide-react";

interface CookBottomNavProps {
  pendingCount?: number;
}

const tabs = [
  { icon: LayoutDashboard, label: "Home", path: "/cook/dashboard" },
  { icon: ClipboardList, label: "Orders", path: "/cook/orders" },
  { icon: UtensilsCrossed, label: "Menu", path: "/cook/menu-submit" },
  { icon: Camera, label: "Upload", path: "/cook/photo-upload" },
  { icon: DollarSign, label: "Earnings", path: "/cook/earnings" },
  { icon: CalendarDays, label: "Schedule", path: "/cook/availability" },
];

const CookBottomNav = ({ pendingCount = 0 }: CookBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16"
      style={{
        backgroundColor: "#1a1f1b",
        borderTop: "1px solid rgba(134,163,131,0.2)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
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
                style={{ color: isActive ? "#86A383" : "rgba(249,247,242,0.4)" }}
              />
              {tab.label === "Orders" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
            <span
              className="font-body"
              style={{
                fontSize: "10px",
                color: isActive ? "#86A383" : "rgba(249,247,242,0.4)",
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
