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
          cancellation_reason: string | null
          cancelled_by: string | null
          cleanliness_rating: number | null
          communication_rating: number | null
          cook_email: string | null
          cook_id: string
          cook_name: string
          cook_phone: string | null
          created_at: string
          customer_name: string
          customer_user_id: string | null
          dietary: string[] | null
          email: string
          frequency: string | null
          grocery_addon: boolean | null
          grocery_fee: number | null
          id: string
          menu_id: string | null
          menu_selected: string
          menu_status: string | null
          paid: boolean | null
          party_size: number | null
          payment_intent_id: string | null
          phone: string
          proof_status: string | null
          punctuality_rating: number | null
          rated_at: string | null
          rating: number | null
          rating_note: string | null
          refund_status: string | null
          selected_menu_id: string | null
          session_notes: string | null
          session_type: string | null
          status: string | null
          taste_rating: number | null
          tier: string | null
          total_aed: number | null
        }
        Insert: {
          address?: string | null
          allergies_notes?: string | null
          area?: string | null
          booking_date?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          cleanliness_rating?: number | null
          communication_rating?: number | null
          cook_email?: string | null
          cook_id: string
          cook_name: string
          cook_phone?: string | null
          created_at?: string
          customer_name: string
          customer_user_id?: string | null
          dietary?: string[] | null
          email: string
          frequency?: string | null
          grocery_addon?: boolean | null
          grocery_fee?: number | null
          id?: string
          menu_id?: string | null
          menu_selected: string
          menu_status?: string | null
          paid?: boolean | null
          party_size?: number | null
          payment_intent_id?: string | null
          phone: string
          proof_status?: string | null
          punctuality_rating?: number | null
          rated_at?: string | null
          rating?: number | null
          rating_note?: string | null
          refund_status?: string | null
          selected_menu_id?: string | null
          session_notes?: string | null
          session_type?: string | null
          status?: string | null
          taste_rating?: number | null
          tier?: string | null
          total_aed?: number | null
        }
        Update: {
          address?: string | null
          allergies_notes?: string | null
          area?: string | null
          booking_date?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          cleanliness_rating?: number | null
          communication_rating?: number | null
          cook_email?: string | null
          cook_id?: string
          cook_name?: string
          cook_phone?: string | null
          created_at?: string
          customer_name?: string
          customer_user_id?: string | null
          dietary?: string[] | null
          email?: string
          frequency?: string | null
          grocery_addon?: boolean | null
          grocery_fee?: number | null
          id?: string
          menu_id?: string | null
          menu_selected?: string
          menu_status?: string | null
          paid?: boolean | null
          party_size?: number | null
          payment_intent_id?: string | null
          phone?: string
          proof_status?: string | null
          punctuality_rating?: number | null
          rated_at?: string | null
          rating?: number | null
          rating_note?: string | null
          refund_status?: string | null
          selected_menu_id?: string | null
          session_notes?: string | null
          session_type?: string | null
          status?: string | null
          taste_rating?: number | null
          tier?: string | null
          total_aed?: number | null
        }
        Relationships: []
      }
      cook_availability: {
        Row: {
          available: boolean | null
          cook_id: string | null
          day_of_week: number
          id: string
          time_slots: string[] | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          cook_id?: string | null
          day_of_week: number
          id?: string
          time_slots?: string[] | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          cook_id?: string | null
          day_of_week?: number
          id?: string
          time_slots?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cook_availability_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_blocked_dates: {
        Row: {
          blocked_date: string
          cook_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_date: string
          cook_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_date?: string
          cook_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_blocked_dates_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_documents: {
        Row: {
          cook_id: string
          document_type: string
          file_url: string
          id: string
          reviewed_at: string | null
          status: string
          uploaded_at: string
        }
        Insert: {
          cook_id: string
          document_type: string
          file_url: string
          id?: string
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string
        }
        Update: {
          cook_id?: string
          document_type?: string
          file_url?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_documents_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_menus: {
        Row: {
          admin_notes: string | null
          cook_id: string | null
          cook_name: string
          created_at: string | null
          cuisine: string | null
          description: string | null
          dietary: string[] | null
          id: string
          meals: string[] | null
          menu_name: string
          photo_urls: string[] | null
          price_aed: number
          rejection_reason: string | null
          serves: number | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          cook_id?: string | null
          cook_name: string
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary?: string[] | null
          id?: string
          meals?: string[] | null
          menu_name: string
          photo_urls?: string[] | null
          price_aed?: number
          rejection_reason?: string | null
          serves?: number | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          cook_id?: string | null
          cook_name?: string
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary?: string[] | null
          id?: string
          meals?: string[] | null
          menu_name?: string
          photo_urls?: string[] | null
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
          operator_notes: string | null
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
          operator_notes?: string | null
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
          operator_notes?: string | null
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
      check_cooks_maria: {
        Args: never
        Returns: {
          cook_id: string
          nm: string
          st: string
          uid: string
        }[]
      }
      count_bad_bookings: {
        Args: never
        Returns: {
          invalid_count: number
        }[]
      }
      get_booking_for_rating: {
        Args: { booking_uuid: string }
        Returns: {
          booking_date: string
          cook_name: string
          id: string
          menu_selected: string
          rated_at: string
          rating: number
          status: string
        }[]
      }
      get_cooks_cols: {
        Args: never
        Returns: {
          col_name: string
          col_type: string
        }[]
      }
      get_cooks_rls: {
        Args: never
        Returns: {
          pol_cmd: string
          pol_name: string
          pol_qual: string
          pol_roles: string
          pol_with_check: string
        }[]
      }
      get_cooks_triggers: {
        Args: never
        Returns: {
          trig_event: string
          trig_func: string
          trig_name: string
          trig_timing: string
        }[]
      }
      get_public_cook_by_id: {
        Args: { cook_uuid: string }
        Returns: {
          area: string
          bio: string
          cuisine: string[]
          health_card: boolean
          id: string
          name: string
          photo_url: string
          status: string
          years_experience: number
        }[]
      }
      get_public_cooks: {
        Args: never
        Returns: {
          area: string
          bio: string
          cuisine: string[]
          health_card: boolean
          id: string
          name: string
          photo_url: string
          status: string
          years_experience: number
        }[]
      }
      list_all_cooks: {
        Args: never
        Returns: {
          cook_id: string
          nm: string
          st: string
          uid: string
        }[]
      }
      show_invalid_bookings: {
        Args: never
        Returns: {
          bad_amt: number
          customer: string
          freq_val: string
          row_id: string
          tier_val: string
        }[]
      }
      submit_booking_rating:
        | {
            Args: { booking_uuid: string; p_note?: string; p_rating: number }
            Returns: undefined
          }
        | {
            Args: {
              booking_uuid: string
              p_cleanliness?: number
              p_communication?: number
              p_note?: string
              p_punctuality?: number
              p_rating: number
              p_taste?: number
            }
            Returns: undefined
          }
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
