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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          account_id: string
          client_id: string
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          account_id: string
          action: string
          at: string | null
          details: Json | null
          id: number
          row_id: string | null
          table_name: string
        }
        Insert: {
          account_id: string
          action: string
          at?: string | null
          details?: Json | null
          id?: never
          row_id?: string | null
          table_name: string
        }
        Update: {
          account_id?: string
          action?: string
          at?: string | null
          details?: Json | null
          id?: never
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          account_id: string
          active: boolean | null
          address_line: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          pathisi: string | null
          phone: string | null
          registration_date: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          active?: boolean | null
          address_line?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          pathisi?: string | null
          phone?: string | null
          registration_date?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          active?: boolean | null
          address_line?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          pathisi?: string | null
          phone?: string | null
          registration_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          account_id: string
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          price_per_session: number | null
          sessions_total: number
          sessions_used: number
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          price_per_session?: number | null
          sessions_total: number
          sessions_used?: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          price_per_session?: number | null
          sessions_total?: number
          sessions_used?: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_id: string
          amount: number
          client_id: string
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          session_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          client_id: string
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          session_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          client_id?: string
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          account_id: string
          bill_amount: number | null
          client_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          package_id: string | null
          session_number_in_package: number | null
          started_at: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          bill_amount?: number | null
          client_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          package_id?: string | null
          session_number_in_package?: number | null
          started_at?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          bill_amount?: number | null
          client_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          package_id?: string | null
          session_number_in_package?: number | null
          started_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_balances: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_due: number
          client_id: string
          total_billed: number
          total_paid: number
        }[]
      }
      create_session: {
        Args: {
          p_client_id: string
          p_duration_minutes?: number
          p_notes?: string
          p_started_at?: string
        }
        Returns: {
          account_id: string
          bill_amount: number | null
          client_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          package_id: string | null
          session_number_in_package: number | null
          started_at: string
          updated_at: string | null
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sessions_per_day: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          sessions_count: number
        }[]
      }
      sessions_per_month: {
        Args: { p_year: number }
        Returns: {
          month: string
          sessions_count: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "staff"
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
    Enums: {
      app_role: ["owner", "staff"],
    },
  },
} as const
