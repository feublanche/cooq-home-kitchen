import { useNavigate } from "react-router-dom";
import cooqLogo from "@/assets/cooq-logo.png";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F9F7F2] min-h-screen flex flex-col items-center justify-center px-4">
      <img src={cooqLogo} alt="Cooq" className="h-8 mb-6" />
      <h1 className="font-display text-[28px] text-[#2D312E] mb-2">Page not found</h1>
      <p className="text-sm text-gray-400 mb-6">This page doesn't exist or has moved.</p>
      <button onClick={() => navigate("/")} className="bg-[#B57E5D] text-white rounded-xl py-3 px-8 font-semibold text-sm">
        ← Go home
      </button>
    </div>
  );
};

export default NotFound;
