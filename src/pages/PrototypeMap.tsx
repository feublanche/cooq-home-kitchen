import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, ExternalLink } from "lucide-react";

// Enable a global preview-bypass so protected routes render inside the
// prototype map iframes without requiring real auth.
if (typeof window !== "undefined") {
  try {
    sessionStorage.setItem("prototype_preview", "1");
    localStorage.setItem("prototype_preview", "1");
  } catch {}
}

type PageItem = { path: string; label: string; note?: string };
type Section = { title: string; color: string; items: PageItem[]; flow?: string };

const sections: Section[] = [
  {
    title: "Entry & Discovery",
    color: "border-copper",
    flow: "Home → Search → Results → Cook Profile → Book",
    items: [
      { path: "/", label: "Home" },
      { path: "/search", label: "Search" },
      { path: "/results", label: "Results" },
      { path: "/cook/1", label: "Cook Profile", note: "sample id" },
    ],
  },
  {
    title: "Customer Booking Flow",
    color: "border-primary",
    flow: "Book → Payment → Confirmation → My Bookings → Rate",
    items: [
      { path: "/book", label: "Booking Form", note: "auth required" },
      { path: "/payment", label: "Payment", note: "auth required" },
      { path: "/confirmation", label: "Confirmation" },
      { path: "/my-bookings", label: "My Bookings", note: "auth required" },
      { path: "/bookings", label: "Bookings", note: "auth required" },
      { path: "/rate/sample", label: "Rate Session", note: "auth required" },
    ],
  },
  {
    title: "Customer Account",
    color: "border-emerald-600",
    flow: "Account (auth) → Account Page → Reset Password",
    items: [
      { path: "/account", label: "Customer Auth" },
      { path: "/account-page", label: "Account", note: "auth required" },
      { path: "/reset-password", label: "Reset Password" },
    ],
  },
  {
    title: "Cook Portal",
    color: "border-amber-700",
    flow: "Login/Signup → Dashboard → (Menus, Orders, Earnings, Availability, Profile, Documents)",
    items: [
      { path: "/cook/login", label: "Cook Login" },
      { path: "/cook/signup", label: "Cook Signup" },
      { path: "/cook/dashboard", label: "Cook Dashboard", note: "auth required" },
      { path: "/cook/orders", label: "Cook Orders", note: "auth required" },
      { path: "/cook/menus", label: "Cook Menus", note: "auth required" },
      { path: "/cook/menu-submit", label: "Submit Menu", note: "auth required" },
      { path: "/cook/photo-upload", label: "Photo Upload", note: "auth required" },
      { path: "/cook/earnings", label: "Cook Earnings", note: "auth required" },
      { path: "/cook/availability", label: "Availability", note: "auth required" },
      { path: "/cook/profile", label: "Cook Profile", note: "auth required" },
      { path: "/cook/documents", label: "Documents", note: "auth required" },
    ],
  },
  {
    title: "Operator / Admin",
    color: "border-red-700",
    flow: "Operator Login → Admin Dashboard",
    items: [
      { path: "/operator/login", label: "Operator Login" },
      { path: "/admin", label: "Admin Dashboard", note: "operator role" },
    ],
  },
  {
    title: "Legal & Misc",
    color: "border-stone-500",
    items: [
      { path: "/terms", label: "Terms" },
      { path: "/privacy", label: "Privacy" },
      { path: "/cook-agreement", label: "Cook Agreement" },
      { path: "/cook-privacy", label: "Cook Privacy" },
    ],
  },
];

const Thumb = ({ item, onOpen }: { item: PageItem; onOpen: (p: PageItem) => void }) => (
  <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="block w-full text-left group"
      aria-label={`Preview ${item.label}`}
    >
      <div className="relative w-full bg-muted overflow-hidden" style={{ height: 320 }}>
        <div
          className="absolute top-0 left-0 pointer-events-none origin-top-left"
          style={{ width: 430, height: 800, transform: "scale(0.5)" }}
        >
          <iframe
            src={item.path}
            title={item.label}
            className="w-full h-full border-0 bg-background"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 group-hover:bg-foreground/10 transition-colors" />
      </div>
    </button>
    <div className="p-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-foreground truncate">{item.label}</p>
        <p className="font-body text-xs text-muted-foreground truncate">
          {item.path}
          {item.note && <span className="ml-2 italic">({item.note})</span>}
        </p>
      </div>
      <Link
        to={item.path}
        className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground"
        title="Open page"
      >
        <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  </div>
);

const PrototypeMap = () => {
  const [active, setActive] = useState<PageItem | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("prototype_preview", "1");
      localStorage.setItem("prototype_preview", "1");
    } catch {}
  }, []);

  return (
    <div className="fixed inset-0 overflow-auto bg-background z-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10">
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-2">
            Internal
          </p>
          <h1 className="font-heading italic text-4xl text-foreground mb-2">Prototype Map</h1>
          <p className="font-body text-sm text-muted-foreground max-w-2xl">
            Click any thumbnail to view it full-screen. Use the external-link icon to open the page in this tab.
          </p>
        </header>

        {sections.map((section) => (
          <section key={section.title} className={`mb-12 pl-4 border-l-4 ${section.color}`}>
            <div className="mb-4">
              <h2 className="font-heading italic text-2xl text-foreground">{section.title}</h2>
              {section.flow && (
                <p className="font-body text-xs text-muted-foreground mt-1">Flow: {section.flow}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {section.items.map((item) => (
                <Thumb key={item.path} item={item} onOpen={setActive} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-[460px] h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground truncate">{active.label}</p>
                <p className="font-body text-xs text-muted-foreground truncate">{active.path}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={active.path}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title="Open page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              src={active.path}
              title={active.label}
              className="flex-1 w-full border-0 bg-background"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PrototypeMap;
