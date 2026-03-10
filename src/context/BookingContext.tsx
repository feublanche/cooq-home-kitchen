import React, { createContext, useContext, useState, ReactNode } from "react";

export interface BookingState {
  // Step 1
  location: string;
  // Step 2
  frequency: string;
  meals: string[];
  // Step 3 - selected days of the week
  selectedDays: string[];
  partySize: number;
  // Step 4
  cuisines: string[];
  // Step 5
  dietary: string[];
  allergyNotes: string;
  // Step 6 - language / gender
  languages: string[];
  genderPreference: string;
  // Cook selection
  cookId: string;
  cookName: string;
  cookCuisine: string;
  // Menu — one per meal type (lunch menu, dinner menu)
  menuSelected: string;
  menuSelectedDinner: string; // second menu if both lunch & dinner
  menuPrice: number;
  // Swap credits (max 2 dish swaps)
  swappedDishes: { original: string; replacement: string }[];
  // Add-ons
  addOns: string[];
  // Booking type
  bookingType: "one-time" | "subscribe";
  // Selected booking dates (multiple based on frequency)
  bookingDates: string[];
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
  selectedDays: [],
  partySize: 2,
  cuisines: [],
  dietary: [],
  allergyNotes: "",
  languages: [],
  genderPreference: "",
  cookId: "",
  cookName: "",
  cookCuisine: "",
  menuSelected: "",
  menuSelectedDinner: "",
  menuPrice: 350,
  swappedDishes: [],
  addOns: [],
  bookingType: "one-time",
  bookingDates: [],
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
