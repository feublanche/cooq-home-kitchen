import React, { createContext, useContext, useState, ReactNode } from "react";

export interface BookingState {
  // Step 1
  location: string;
  // Step 2
  frequency: string;
  meals: string[];
  // Step 3
  startDate: string;
  partySize: number;
  // Step 4
  cuisines: string[];
  // Step 5
  dietary: string[];
  allergyNotes: string;
  // Cook selection
  cookId: string;
  cookName: string;
  cookCuisine: string;
  // Menu
  menuSelected: string;
  menuPrice: number;
  // Booking type
  bookingType: "one-time" | "subscribe";
  // Selected date
  bookingDate: string;
  // Booking form
  customerName: string;
  email: string;
  phone: string;
  address: string;
  groceryAddon: boolean;
  totalAed: number;
}

const defaultState: BookingState = {
  location: "",
  frequency: "",
  meals: [],
  startDate: "",
  partySize: 2,
  cuisines: [],
  dietary: [],
  allergyNotes: "",
  cookId: "",
  cookName: "",
  cookCuisine: "",
  menuSelected: "",
  menuPrice: 350,
  bookingType: "one-time",
  bookingDate: "",
  customerName: "",
  email: "",
  phone: "",
  address: "",
  groceryAddon: false,
  totalAed: 350,
};

interface BookingContextType {
  booking: BookingState;
  updateBooking: (updates: Partial<BookingState>) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [booking, setBooking] = useState<BookingState>(defaultState);

  const updateBooking = (updates: Partial<BookingState>) => {
    setBooking((prev) => ({ ...prev, ...updates }));
  };

  const resetBooking = () => setBooking(defaultState);

  return (
    <BookingContext.Provider value={{ booking, updateBooking, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
};
