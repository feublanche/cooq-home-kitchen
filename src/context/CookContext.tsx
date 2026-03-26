import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCook = async (userId: string) => {
      setLoading(true);
      const { data } = await supabase
        .from("cooks")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .single();
      setCook(data ? (data as unknown as CookRow) : null);
      setLoading(false);
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchCook(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchCook(session.user.id);
      } else {
        setCook(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CookContext.Provider value={{ cook, setCook, loading }}>
      {children}
    </CookContext.Provider>
  );
};

export const useCook = () => useContext(CookContext);
