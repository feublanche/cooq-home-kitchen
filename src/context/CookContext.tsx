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
    let cancelled = false;

    const fetchCook = async (userId: string) => {
      const { data, error } = await supabase
        .from("cooks")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setCook(data as unknown as CookRow);
      } else {
        setCook(null);
      }
      setLoading(false);
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        fetchCook(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        fetchCook(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setCook(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <CookContext.Provider value={{ cook, setCook, loading }}>
      {children}
    </CookContext.Provider>
  );
};

export const useCook = () => useContext(CookContext);
