export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          allergies_notes: string | null
          area: string | null
          booking_date: string | null
          cook_email: string | null
          cook_id: string
          cook_name: string
          cook_phone: string | null
          created_at: string
          customer_name: string
          dietary: string[] | null
          email: string
          frequency: string | null
          grocery_addon: boolean | null
          id: string
          menu_selected: string
          menu_status: string | null
          paid: boolean | null
          party_size: number | null
          payment_intent_id: string | null
          phone: string
          session_notes: string | null
          status: string | null
          total_aed: number | null
        }
        Insert: {
          address?: string | null
          allergies_notes?: string | null
          area?: string | null
          booking_date?: string | null
          cook_email?: string | null
          cook_id: string
          cook_name: string
          cook_phone?: string | null
          created_at?: string
          customer_name: string
          dietary?: string[] | null
          email: string
          frequency?: string | null
          grocery_addon?: boolean | null
          id?: string
          menu_selected: string
          menu_status?: string | null
          paid?: boolean | null
          party_size?: number | null
          payment_intent_id?: string | null
          phone: string
          session_notes?: string | null
          status?: string | null
          total_aed?: number | null
        }
        Update: {
          address?: string | null
          allergies_notes?: string | null
          area?: string | null
          booking_date?: string | null
          cook_email?: string | null
          cook_id?: string
          cook_name?: string
          cook_phone?: string | null
          created_at?: string
          customer_name?: string
          dietary?: string[] | null
          email?: string
          frequency?: string | null
          grocery_addon?: boolean | null
          id?: string
          menu_selected?: string
          menu_status?: string | null
          paid?: boolean | null
          party_size?: number | null
          payment_intent_id?: string | null
          phone?: string
          session_notes?: string | null
          status?: string | null
          total_aed?: number | null
        }
        Relationships: []
      }
      cook_menus: {
        Row: {
          cook_id: string | null
          cook_name: string
          created_at: string | null
          cuisine: string | null
          dietary: string[] | null
          id: string
          meals: string[] | null
          menu_name: string
          price_aed: number
          rejection_reason: string | null
          serves: number | null
          status: string | null
        }
        Insert: {
          cook_id?: string | null
          cook_name: string
          created_at?: string | null
          cuisine?: string | null
          dietary?: string[] | null
          id?: string
          meals?: string[] | null
          menu_name: string
          price_aed?: number
          rejection_reason?: string | null
          serves?: number | null
          status?: string | null
        }
        Update: {
          cook_id?: string | null
          cook_name?: string
          created_at?: string | null
          cuisine?: string | null
          dietary?: string[] | null
          id?: string
          meals?: string[] | null
          menu_name?: string
          price_aed?: number
          rejection_reason?: string | null
          serves?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cook_menus_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      cooks: {
        Row: {
          area: string | null
          bio: string | null
          created_at: string | null
          cuisine: string[] | null
          email: string
          health_card: boolean | null
          health_card_expiry: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          status: string | null
          stripe_account_id: string | null
          user_id: string | null
          visa_type: string | null
          years_experience: number | null
        }
        Insert: {
          area?: string | null
          bio?: string | null
          created_at?: string | null
          cuisine?: string[] | null
          email: string
          health_card?: boolean | null
          health_card_expiry?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          stripe_account_id?: string | null
          user_id?: string | null
          visa_type?: string | null
          years_experience?: number | null
        }
        Update: {
          area?: string | null
          bio?: string | null
          created_at?: string | null
          cuisine?: string[] | null
          email?: string
          health_card?: boolean | null
          health_card_expiry?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          stripe_account_id?: string | null
          user_id?: string | null
          visa_type?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      quality_photos: {
        Row: {
          approved: boolean | null
          booking_id: string
          cook_id: string
          cook_name: string
          id: string
          photo_type: string
          photo_url: string
          reviewed: boolean | null
          uploaded_at: string
        }
        Insert: {
          approved?: boolean | null
          booking_id: string
          cook_id: string
          cook_name: string
          id?: string
          photo_type: string
          photo_url: string
          reviewed?: boolean | null
          uploaded_at?: string
        }
        Update: {
          approved?: boolean | null
          booking_id?: string
          cook_id?: string
          cook_name?: string
          id?: string
          photo_type?: string
          photo_url?: string
          reviewed?: boolean | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_photos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
