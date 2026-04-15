import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "What We Collect", body: "Name, email address, phone number, delivery address, dietary preferences, booking history, and payment information (processed securely by Stripe — we do not store your card details)." },
  { title: "Why We Collect It", body: "To match you with the right cook, process your bookings, communicate session details, handle payments, and improve the quality of our service." },
  { title: "Who We Share It With", body: "Your first name, address, dietary preferences, and session details are shared with your assigned cook to fulfil your booking. We never sell your data. We may share data with UAE authorities if legally required." },
  { title: "How We Store It", body: "All data is stored securely on encrypted servers. Payment processing is handled by Stripe, a PCI-compliant payment provider. We do not store your credit or debit card details." },
  { title: "Your Rights", body: "Under Federal Decree-Law No. 45 of 2021, you have the right to access, correct, or request deletion of your personal data at any time. Contact: admin.cooq@gmail.com" },
  { title: "Data Retention", body: "Your account data is retained while your account is active. Booking history is retained for 12 months after the last session. You may request full deletion at any time." },
  { title: "Cookies", body: "Essential authentication cookies only." },
  { title: "Contact", body: "admin.cooq@gmail.com" },
];

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>
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
