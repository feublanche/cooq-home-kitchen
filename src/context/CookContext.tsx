import { createContext, useContext, useState, ReactNode } from "react";

export interface CookRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  cuisine: string[] | null;
  area: string | null;
  bio: string | null;
  photo_url: string | null;
  years_experience: number | null;
  status: string | null;
  health_card: boolean | null;
  health_card_expiry: string | null;
  visa_type: string | null;
  stripe_account_id: string | null;
}

interface CookContextType {
  cook: CookRow | null;
  setCook: (cook: CookRow | null) => void;
  loading: boolean;
}

export const CookContext = createContext<CookContextType>({
  cook: null,
  setCook: () => {},
  loading: true,
});

export const CookProvider = ({ children }: { children: ReactNode }) => {
  const [cook, setCook] = useState<CookRow | null>(null);
  const [loading] = useState(false);

  return (
    <CookContext.Provider value={{ cook, setCook, loading }}>
      {children}
    </CookContext.Provider>
  );
};

export const useCook = () => useContext(CookContext);
