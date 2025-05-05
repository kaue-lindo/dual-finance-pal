export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      finances: {
        Row: {
          amount: number
          auth_id: string | null
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          installment_current: number | null
          installment_total: number | null
          is_compound: boolean | null
          recurring: boolean | null
          recurring_days: number[] | null
          recurring_type: string | null
          source_category: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auth_id?: string | null
          category?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          is_compound?: boolean | null
          recurring?: boolean | null
          recurring_days?: number[] | null
          recurring_type?: string | null
          source_category?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auth_id?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          is_compound?: boolean | null
          recurring?: boolean | null
          recurring_days?: number[] | null
          recurring_type?: string | null
          source_category?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          end_date: string
          id: string
          interest_rate: number
          name: string
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          end_date: string
          id?: string
          interest_rate: number
          name: string
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_date?: string
          id?: string
          interest_rate?: number
          name?: string
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_message: string | null
          name: string
          phone: string
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          name: string
          phone: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_message?: string | null
          name?: string
          phone?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          id: string
          lead_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          direction: string
          id?: string
          lead_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string
          created_at: string
          id: string
          model: Database["public"]["Enums"]["shirt_model"]
          order_id: number
          price_per_unit: number
          quantity: number
          size: Database["public"]["Enums"]["shirt_size"]
          technique: string | null
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          model: Database["public"]["Enums"]["shirt_model"]
          order_id: number
          price_per_unit: number
          quantity: number
          size: Database["public"]["Enums"]["shirt_size"]
          technique?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          model?: Database["public"]["Enums"]["shirt_model"]
          order_id?: number
          price_per_unit?: number
          quantity?: number
          size?: Database["public"]["Enums"]["shirt_size"]
          technique?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string
          delivery_date: string
          drive_link: string
          id: number
          installments_count: number | null
          order_number: string
          os_number: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pieces_quantity: number
          production_machine: string | null
          production_method: Database["public"]["Enums"]["production_method"]
          received_date: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_date: string
          drive_link: string
          id?: number
          installments_count?: number | null
          order_number: string
          os_number?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pieces_quantity: number
          production_machine?: string | null
          production_method: Database["public"]["Enums"]["production_method"]
          received_date: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_date?: string
          drive_link?: string
          id?: number
          installments_count?: number | null
          order_number?: string
          os_number?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pieces_quantity?: number
          production_machine?: string | null
          production_method?: Database["public"]["Enums"]["production_method"]
          received_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          item_color: string
          item_model: string
          item_quantity: number
          item_size: string
          machine: string
          operator: string
          order_number: string
          os_number: string | null
          production_date: string
          reason_for_stop: string | null
          start_time: string
          status: string
          technique: string | null
          total_time_seconds: number | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          item_color: string
          item_model: string
          item_quantity: number
          item_size: string
          machine: string
          operator: string
          order_number: string
          os_number?: string | null
          production_date: string
          reason_for_stop?: string | null
          start_time: string
          status: string
          technique?: string | null
          total_time_seconds?: number | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          item_color?: string
          item_model?: string
          item_quantity?: number
          item_size?: string
          machine?: string
          operator?: string
          order_number?: string
          os_number?: string | null
          production_date?: string
          reason_for_stop?: string | null
          start_time?: string
          status?: string
          technique?: string | null
          total_time_seconds?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          recurrence_days: number[] | null
          recurrence_type: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_id: string
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_id: string
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_id?: string
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_stage: "entrada" | "orcamento" | "design"
      order_status:
        | "producao_arte"
        | "arte_finalizada"
        | "producao_dtf"
        | "producao_dtg"
        | "producao_silk"
        | "producao_bordado"
        | "finalizado"
        | "separacao"
        | "producao_mista"
      payment_method: "a_vista" | "parcelado" | "boleto"
      production_method: "dtf" | "dtg" | "silk" | "bordado"
      shirt_model:
        | "basico"
        | "polo"
        | "gola_v"
        | "malha_fria"
        | "baby_look"
        | "polo_feminina"
        | "regata_masculina"
        | "regata_feminina"
      shirt_size:
        | "0"
        | "2"
        | "4"
        | "6"
        | "8"
        | "10"
        | "12"
        | "14"
        | "16"
        | "P"
        | "M"
        | "G"
        | "GG"
        | "EG"
        | "EGG"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lead_stage: ["entrada", "orcamento", "design"],
      order_status: [
        "producao_arte",
        "arte_finalizada",
        "producao_dtf",
        "producao_dtg",
        "producao_silk",
        "producao_bordado",
        "finalizado",
        "separacao",
        "producao_mista",
      ],
      payment_method: ["a_vista", "parcelado", "boleto"],
      production_method: ["dtf", "dtg", "silk", "bordado"],
      shirt_model: [
        "basico",
        "polo",
        "gola_v",
        "malha_fria",
        "baby_look",
        "polo_feminina",
        "regata_masculina",
        "regata_feminina",
      ],
      shirt_size: [
        "0",
        "2",
        "4",
        "6",
        "8",
        "10",
        "12",
        "14",
        "16",
        "P",
        "M",
        "G",
        "GG",
        "EG",
        "EGG",
      ],
      user_role: ["admin", "user"],
    },
  },
} as const
