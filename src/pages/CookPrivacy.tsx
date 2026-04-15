import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "What We Collect", body: "Name, email, phone number, Emirates ID, health card/food safety certificate, bank details (when provided for payouts), profile photo, and session proof photos." },
  { title: "Why We Collect It", body: "To verify your identity, onboard you as a Cooq cook partner, match you with customers, process monthly payments, and ensure platform safety and quality." },
  { title: "Who We Share It With", body: "We share only your first name and profile photo with customers after they complete a booking. We never sell your data. We may share data with UAE authorities if legally required." },
  { title: "How We Store It", body: "All data is stored securely on encrypted servers. Documents are accessible only to authorised Cooq staff and are never shared with customers or third parties." },
  { title: "Your Rights", body: "Under Federal Decree-Law No. 45 of 2021, you have the right to access, correct, or request deletion of your personal data at any time. Contact: admin.cooq@gmail.com" },
  { title: "Document Retention", body: "Identity documents are retained for the duration of your active partnership and deleted within 30 days of account termination upon request." },
  { title: "Cookies", body: "Essential authentication cookies only." },
  { title: "Contact", body: "admin.cooq@gmail.com" },
];

const CookPrivacy = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Cook Privacy Policy</h1>
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

export default CookPrivacy;
