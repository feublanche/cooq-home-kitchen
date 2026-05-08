import { Link } from "react-router-dom";

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

const Thumb = ({ path, label, note }: PageItem) => (
  <Link
    to={path}
    className="group block bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
  >
    <div className="relative w-full bg-muted overflow-hidden" style={{ height: 320 }}>
      <div
        className="absolute top-0 left-0 pointer-events-none origin-top-left"
        style={{ width: 430, height: 800, transform: "scale(0.5)" }}
      >
        <iframe
          src={path}
          title={label}
          className="w-full h-full border-0 bg-background"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 group-hover:bg-foreground/5 transition-colors" />
    </div>
    <div className="p-3">
      <p className="font-body text-sm font-semibold text-foreground truncate">{label}</p>
      <p className="font-body text-xs text-muted-foreground truncate">
        {path}
        {note && <span className="ml-2 italic">({note})</span>}
      </p>
    </div>
  </Link>
);

const PrototypeMap = () => {
  return (
    <div className="fixed inset-0 overflow-auto bg-background z-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10">
          <p className="font-body text-xs font-semibold tracking-[0.15em] uppercase text-copper mb-2">
            Internal
          </p>
          <h1 className="font-heading italic text-4xl text-foreground mb-2">Prototype Map</h1>
          <p className="font-body text-sm text-muted-foreground max-w-2xl">
            Live thumbnail previews of every page in the app, grouped by user flow. Click any tile to open the page.
            Auth-protected pages may render their login screen inside the preview.
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
                <Thumb key={item.path} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PrototypeMap;
