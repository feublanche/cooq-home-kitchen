import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { title: "Independent Contractor Status", body: "You are engaged as an independent contractor, not an employee of Cooq. You are responsible for your own tax obligations, insurance, and compliance with UAE law." },
  { title: "Eligibility Requirements", body: "You must hold: a valid UAE residence visa, a valid Emirates ID, and a DHA-approved health card or food safety certificate. Cooq reserves the right to request updated documents at any time." },
  { title: "Platform Fee", body: "Cooq charges a platform fee per completed session. The applicable fee is communicated to you separately and may be updated with 30 days' written notice." },
  { title: "Session Standards", body: "You agree to: arrive within ±30 minutes of the agreed time, leave the client's kitchen clean and tidy, store all prepared meals in sealed, labelled containers, and behave professionally at all times." },
  { title: "Proof of Completion", body: "Within 2 hours of completing a session, you must upload via the Cooq app: (a) a photo of the clean kitchen and (b) a photo of food containers. Failure to upload proof may result in delayed or withheld payment." },
  { title: "Customer Contact", body: "You must not contact customers directly outside the Cooq platform — including via phone, WhatsApp, social media, or any other channel — for the purpose of soliciting bookings, exchanging payment, or any other commercial purpose. Breach of this clause will result in immediate suspension and may result in legal action. All communication with customers must occur through the Cooq platform only. This clause is designed to protect both you and the customer and is strictly enforced." },
  { title: "Confidentiality", body: "You must keep all customer information (name, address, dietary preferences) strictly confidential. You must not disclose, share, or use customer data for any purpose outside of fulfilling your Cooq booking." },
  { title: "Cancellations", body: "You must provide at least 48 hours notice to cancel a booking. Repeated cancellations may result in suspension from the platform." },
  { title: "Termination", body: "Cooq may suspend or terminate your access to the platform at any time for breach of this agreement, quality issues, or any conduct that damages Cooq's reputation or customer trust."},
  { title: "Governing Law", body: "This agreement is governed by the laws of the United Arab Emirates. Any disputes shall be subject to the jurisdiction of Dubai courts." },
  { title: "Contact", body: "admin.cooq@gmail.com" },
];

const CookAgreement = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen">
      <div className="max-w-[700px] mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="w-5 h-5 text-[#2D312E]" /></button>
        <h1 className="font-display text-[32px] text-[#2D312E] mb-2">Cook Partner Agreement</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>
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
