import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "What We Collect", body: "Name, email, phone, address, dietary needs. Payment processed by Stripe — not stored by Cooq." },
  { title: "How We Use Your Data", body: "To match you with a cook, process bookings, and send updates." },
  { title: "Who We Share It With", body: "Your address is shared with your cook on session day only. Your data is never sold." },
  { title: "Data Storage", body: "[TO BE COMPLETED]" },
  { title: "Your Rights", body: "Request data deletion at hello@cooq.ae" },
  { title: "Cookies", body: "Essential authentication cookies only." },
  { title: "Contact", body: "hello@cooq.ae" },
];

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: [PLACEHOLDER]</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-700 text-sm">⚠️ This document is a placeholder. Full policy will be added before public launch.</p>
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

export default Privacy;
