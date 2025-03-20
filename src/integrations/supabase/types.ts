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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
