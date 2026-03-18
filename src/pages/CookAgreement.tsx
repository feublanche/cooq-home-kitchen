import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "Eligibility", body: "Valid UAE visa + DHA health card + food safety certificate required." },
  { title: "Commission", body: "Cooq retains 25% per session (Phase 1). Reduces to 20% after 10 completed sessions." },
  { title: "Grocery Shopping", body: "Cook shops for ingredients. AED 75 service fee paid by customer. Groceries reimbursed within 48h." },
  { title: "Session Standards", body: "Arrive within ±30 minutes. Leave kitchen spotless. All meals in labelled sealed containers." },
  { title: "Proof of Quality", body: "Upload container photo + kitchen photo within 2 hours of session. No photos = no payment." },
  { title: "Cancellations", body: "48h+ notice required. Repeated cancellations may result in suspension." },
  { title: "Confidentiality", body: "No contact with customers outside the Cooq platform." },
  { title: "Contact", body: "hello@cooq.ae" },
];

const CookAgreement = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Cook Partner Agreement</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: [PLACEHOLDER]</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-700 text-sm">⚠️ This document is a placeholder. Full agreement will be added before public launch.</p>
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

export default CookAgreement;
