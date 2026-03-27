import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import cooqLogo from "@/assets/cooq-logo.png";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentState {
  bookingId: string;
  totalAed: number;
  customerName: string;
  customerEmail: string;
  area: string;
  bookingDate: string;
  bookingTime: string;
  menuSelected: string;
  cookName: string | null;
  cookId: string;
  selectedMenuName: string;
  secondaryBookingDate?: string | null;
  secondaryMenuName?: string | null;
}

const CheckoutForm = ({ totalAed, bookingId, paymentState, paymentIntentId }: { totalAed: number; bookingId: string; paymentState: PaymentState; paymentIntentId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/confirmation" },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    // Booking confirmation handled server-side by stripe-webhook

    navigate("/confirmation", {
      replace: true,
      state: {
        bookingId: paymentState.bookingId,
        cookId: paymentState.cookId,
        totalPaid: paymentState.totalAed,
        bookingDate: paymentState.bookingDate,
        bookingTime: paymentState.bookingTime,
        area: paymentState.area,
        selectedMenuName: paymentState.selectedMenuName || paymentState.menuSelected,
          secondaryBookingDate: paymentState.secondaryBookingDate,
          secondaryMenuName: paymentState.secondaryMenuName,
        recurringDays: (paymentState as any).recurringDays,
        frequency: (paymentState as any).frequency,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-4 mt-4">
        <PaymentElement />
      </div>
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      )}
      <button type="submit" disabled={processing || !stripe}
        className="mx-4 mt-4 w-[calc(100%-2rem)] py-4 rounded-xl font-body font-semibold text-base text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        style={{ backgroundColor: "#B57E5D" }}>
        {processing ? (<><Loader2 className="w-5 h-5 animate-spin text-white" />Processing...</>) : `Pay AED ${totalAed} Securely`}
      </button>
      <div className="flex items-center justify-center gap-1.5 mt-3 mb-8">
        <Lock className="w-3 h-3 text-slate-400" />
        <span className="font-body text-[10px] text-slate-400">Secured by Stripe</span>
      </div>
    </form>
  );
};

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState | null;

  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state) { navigate("/", { replace: true }); return; }
    const createIntent = async () => {
      const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
        body: { booking_id: state.bookingId },
      });
      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || "Unable to start payment.");
        setLoading(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setLoading(false);
    };
    createIntent();
  }, [state, navigate]);

  if (!state) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9F7F2" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#86A383" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: "#F9F7F2" }}>
        <p className="font-body text-sm text-slate-600 text-center">{error}</p>
        <button onClick={() => navigate(-1)} className="font-body text-sm underline" style={{ color: "#86A383" }}>Go back</button>
      </div>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: { colorPrimary: "#86A383", borderRadius: "12px", fontFamily: "DM Sans, sans-serif" },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F7F2" }}>
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-between px-4 py-4">
          <img src={cooqLogo} alt="Cooq" className="h-7" />
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="font-body text-[10px] text-slate-400">Secured by Stripe</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm mx-4 mt-4 p-5">
          <h2 className="font-display text-base text-slate-800 mb-3">Your Booking</h2>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-body text-sm text-slate-500">Cook</span>
            {state.cookName ? (
              <span className="font-body text-sm text-slate-800">{state.cookName}</span>
            ) : (
              <span className="font-body text-sm text-slate-400 italic">To be matched</span>
            )}
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-body text-sm text-slate-500">Date</span>
            <span className="font-body text-sm text-slate-800">{state.bookingDate || "TBC"}</span>
          </div>
          {state.bookingTime && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-body text-sm text-slate-500">Time</span>
              <span className="font-body text-sm text-slate-800">{state.bookingTime}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-body text-sm text-slate-500">Area</span>
            <span className="font-body text-sm text-slate-800">{state.area}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-body text-sm text-slate-500">Menu</span>
            <span className="font-body text-xs text-slate-400 italic truncate max-w-[180px]">{state.menuSelected}</span>
          </div>
          {state.secondaryBookingDate && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-body text-sm text-slate-500">2nd Date</span>
              <span className="font-body text-sm text-slate-800">{state.secondaryBookingDate}</span>
            </div>
          )}
          {state.secondaryMenuName && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-body text-sm text-slate-500">2nd Menu</span>
              <span className="font-body text-xs text-slate-400 italic truncate max-w-[180px]">{state.secondaryMenuName}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="font-display text-xl font-bold text-slate-800">AED {state.totalAed}</span>
            <span className="font-body text-[10px] text-slate-400 text-right">Held securely until session complete</span>
          </div>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm totalAed={state.totalAed} bookingId={state.bookingId} paymentState={state} paymentIntentId={paymentIntentId} />
          </Elements>
        )}
      </div>
    </div>
  );
}
