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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cashback_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          file_size: number
          file_url: string
          filename: string
          id: string
          property_id: string | null
          shared_with_tenant: boolean
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_size?: number
          file_url?: string
          filename?: string
          id?: string
          property_id?: string | null
          shared_with_tenant?: boolean
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          file_size?: number
          file_url?: string
          filename?: string
          id?: string
          property_id?: string | null
          shared_with_tenant?: boolean
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invite_link: string
          invited_at: string
          invited_by: string
          property_id: string
          status: string
          tenant_name: string
          unit_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invite_link?: string
          invited_at?: string
          invited_by: string
          property_id: string
          status?: string
          tenant_name?: string
          unit_id?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_link?: string
          invited_at?: string
          invited_by?: string
          property_id?: string
          status?: string
          tenant_name?: string
          unit_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          gender: string | null
          id: string
          name: string
          owner_name: string | null
          property_id: string | null
          role: string
          salutation: string
          setup_checklist_complete: boolean
          setup_wizard_complete: boolean
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          name?: string
          owner_name?: string | null
          property_id?: string | null
          role?: string
          salutation?: string
          setup_checklist_complete?: boolean
          setup_wizard_complete?: boolean
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          name?: string
          owner_name?: string | null
          property_id?: string | null
          role?: string
          salutation?: string
          setup_checklist_complete?: boolean
          setup_wizard_complete?: boolean
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          units: number | null
          user_id: string
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          units?: number | null
          user_id: string
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          units?: number | null
          user_id?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      rent_payments: {
        Row: {
          amount: number
          cold_rent: number
          created_at: string | null
          due_date: string
          id: string
          nebenkosten: number
          paid_at: string | null
          status: string
          tenant_name: string
          unit_id: string
          user_id: string
          warm_rent: number
        }
        Insert: {
          amount?: number
          cold_rent?: number
          created_at?: string | null
          due_date: string
          id?: string
          nebenkosten?: number
          paid_at?: string | null
          status?: string
          tenant_name: string
          unit_id: string
          user_id: string
          warm_rent?: number
        }
        Update: {
          amount?: number
          cold_rent?: number
          created_at?: string | null
          due_date?: string
          id?: string
          nebenkosten?: number
          paid_at?: string | null
          status?: string
          tenant_name?: string
          unit_id?: string
          user_id?: string
          warm_rent?: number
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tax_documents: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          document_date: string | null
          file_url: string
          filename: string
          id: string
          property_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          document_date?: string | null
          file_url?: string
          filename?: string
          id?: string
          property_id?: string | null
          user_id: string
          year?: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          document_date?: string | null
          file_url?: string
          filename?: string
          id?: string
          property_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_costs: {
        Row: {
          category: string
          created_at: string
          distribution_key: string
          id: string
          period_id: string
          total_amount: number
        }
        Insert: {
          category: string
          created_at?: string
          distribution_key?: string
          id?: string
          period_id: string
          total_amount?: number
        }
        Update: {
          category?: string
          created_at?: string
          distribution_key?: string
          id?: string
          period_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_costs_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "utility_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_periods: {
        Row: {
          created_at: string
          id: string
          property_id: string
          status: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          status?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          status?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_periods_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_results: {
        Row: {
          advance_paid: number
          allocated_costs: number
          balance: number
          created_at: string
          id: string
          period_id: string
          sqm: number
          tenant_id: string
          tenant_name: string
          unit_id: string
        }
        Insert: {
          advance_paid?: number
          allocated_costs?: number
          balance?: number
          created_at?: string
          id?: string
          period_id: string
          sqm?: number
          tenant_id: string
          tenant_name?: string
          unit_id?: string
        }
        Update: {
          advance_paid?: number
          allocated_costs?: number
          balance?: number
          created_at?: string
          id?: string
          period_id?: string
          sqm?: number
          tenant_id?: string
          tenant_name?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_results_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "utility_periods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
