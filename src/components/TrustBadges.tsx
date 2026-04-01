const badges = [
  { icon: "🛡️", label: "Cooq Certified" },
  { icon: "📅", label: "Reschedule Anytime" },
  { icon: "💳", label: "Secure Payment" },
];

const TrustBadges = () => (
  <div className="flex flex-wrap gap-2 mt-3">
    {badges.map((b) => (
      <span
        key={b.label}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-body text-[10px] font-medium text-primary"
      >
        {b.icon} {b.label}
      </span>
    ))}
  </div>
);

export default TrustBadges;
