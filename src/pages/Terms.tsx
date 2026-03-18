import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "About Cooq", body: "[TO BE COMPLETED]" },
  { title: "Booking & Payment", body: "Full payment required at time of booking. Payments processed securely via Stripe." },
  { title: "Cancellation Policy", body: "48h+ notice: full refund. 24–48h: 50% refund. Under 24h: no refund." },
  { title: "Our Responsibilities", body: "[TO BE COMPLETED]" },
  { title: "Your Responsibilities", body: "[TO BE COMPLETED]" },
  { title: "Governing Law", body: "Laws of the United Arab Emirates. [TO BE COMPLETED]" },
  { title: "Contact", body: "hello@cooq.ae" },
];

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Terms &amp; Conditions</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: [PLACEHOLDER]</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-700 text-sm">⚠️ This document is a placeholder. Full terms will be added before public launch.</p>
        </div>
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="font-display text-[20px] text-[#2D312E] mb-2 mt-6">{i + 1}. {s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terms;
