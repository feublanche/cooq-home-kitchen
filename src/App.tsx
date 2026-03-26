import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookingProvider } from "@/context/BookingContext";
import { CookProvider } from "@/context/CookContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CookProtectedRoute from "@/components/CookProtectedRoute";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Results from "./pages/Results";
import CookProfile from "./pages/CookProfile";
import BookingForm from "./pages/BookingForm";
import Confirmation from "./pages/Confirmation";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import CookLogin from "./pages/cook/CookLogin";
import CookDashboard from "./pages/cook/CookDashboard";
import CookOrders from "./pages/cook/CookOrders";
import CookMenuSubmit from "./pages/cook/CookMenuSubmit";
import CookPhotoUpload from "./pages/cook/CookPhotoUpload";
import CookEarnings from "./pages/cook/CookEarnings";
import CookAvailability from "./pages/cook/CookAvailability";
import Payment from "./pages/Payment";
import RateSession from "./pages/RateSession";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerProtectedRoute from "@/components/CustomerProtectedRoute";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CookAgreement from "./pages/CookAgreement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CookProvider>
      <BookingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="max-w-[430px] mx-auto min-h-screen bg-background" style={{ minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/results" element={<Results />} />
              <Route path="/cook/:id" element={<CookProfile />} />
              <Route path="/book" element={<CustomerProtectedRoute><BookingForm /></CustomerProtectedRoute>} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/account" element={<CustomerAuth />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/my-bookings" element={<CustomerProtectedRoute><MyBookings /></CustomerProtectedRoute>} />
              <Route path="/payment" element={<CustomerProtectedRoute><Payment /></CustomerProtectedRoute>} />
              <Route path="/rate/:bookingId" element={<CustomerProtectedRoute><RateSession /></CustomerProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cook-agreement" element={<CookAgreement />} />
              <Route path="/cook/login" element={<CookLogin />} />
              <Route path="/cook/dashboard" element={<CookProtectedRoute><CookDashboard /></CookProtectedRoute>} />
              <Route path="/cook/orders" element={<CookProtectedRoute><CookOrders /></CookProtectedRoute>} />
              <Route path="/cook/menu-submit" element={<CookProtectedRoute><CookMenuSubmit /></CookProtectedRoute>} />
              <Route path="/cook/photo-upload" element={<CookProtectedRoute><CookPhotoUpload /></CookProtectedRoute>} />
              <Route path="/cook/earnings" element={<CookProtectedRoute><CookEarnings /></CookProtectedRoute>} />
              <Route path="/cook/availability" element={<CookProtectedRoute><CookAvailability /></CookProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </BookingProvider>
      </CookProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
