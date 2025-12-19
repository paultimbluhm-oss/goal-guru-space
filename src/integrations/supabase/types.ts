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
      accounts: {
        Row: {
          account_type: string
          balance: number | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type: string
          balance?: number | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_type: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_skills: {
        Row: {
          activity_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          activity_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          activity_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_skills_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "boredom_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      boredom_activities: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string
          is_productive: boolean | null
          name: string
          total_xp_earned: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_productive?: boolean | null
          name: string
          total_xp_earned?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_productive?: boolean | null
          name?: string
          total_xp_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      business_investments: {
        Row: {
          amount: number
          created_at: string | null
          expected_return: number | null
          id: string
          name: string
          notes: string | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expected_return?: number | null
          id?: string
          name: string
          notes?: string | null
          target_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expected_return?: number | null
          id?: string
          name?: string
          notes?: string | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          checklist_id: string
          completed: boolean | null
          content: string
          created_at: string | null
          id: string
          order_index: number | null
          user_id: string
        }
        Insert: {
          checklist_id: string
          completed?: boolean | null
          content: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          user_id: string
        }
        Update: {
          checklist_id?: string
          completed?: boolean | null
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          grade_type: string
          id: string
          points: number
          subject_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          grade_type: string
          id?: string
          points: number
          subject_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          grade_type?: string
          id?: string
          points?: number
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          subject_id: string
          title: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          subject_id: string
          title: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          subject_id?: string
          title?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          topic: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          topic?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          investment_type: string
          name: string
          purchase_date: string | null
          purchase_price: number
          quantity: number
          symbol: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          investment_type: string
          name: string
          purchase_date?: string | null
          purchase_price: number
          quantity: number
          symbol?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          investment_type?: string
          name?: string
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number
          symbol?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          product_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          product_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          product_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          last_active_date: string | null
          level: number | null
          streak_days: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          last_active_date?: string | null
          level?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          last_active_date?: string | null
          level?: number | null
          streak_days?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          amount: number | null
          id: string
          name: string
          order_index: number | null
          recipe_id: string
          unit: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          id?: string
          name: string
          order_index?: number | null
          recipe_id: string
          unit?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          id?: string
          name?: string
          order_index?: number | null
          recipe_id?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          id: string
          instruction: string
          recipe_id: string
          step_number: number
          user_id: string
        }
        Insert: {
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
          user_id: string
        }
        Update: {
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time_minutes: number | null
          created_at: string | null
          description: string | null
          health_rating: number | null
          id: string
          name: string
          prep_time_minutes: number | null
          servings: number | null
          taste_rating: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          health_rating?: number | null
          id?: string
          name: string
          prep_time_minutes?: number | null
          servings?: number | null
          taste_rating?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          health_rating?: number | null
          id?: string
          name?: string
          prep_time_minutes?: number | null
          servings?: number | null
          taste_rating?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      school_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          subject_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string | null
          grade_year: number
          id: string
          name: string
          oral_weight: number | null
          user_id: string
          written_weight: number | null
        }
        Insert: {
          created_at?: string | null
          grade_year: number
          id?: string
          name: string
          oral_weight?: number | null
          user_id: string
          written_weight?: number | null
        }
        Update: {
          created_at?: string | null
          grade_year?: number
          id?: string
          name?: string
          oral_weight?: number | null
          user_id?: string
          written_weight?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          title: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          title?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number | null
          priority: number | null
          purchased: boolean | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price?: number | null
          priority?: number | null
          purchased?: boolean | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number | null
          priority?: number | null
          purchased?: boolean | null
          url?: string | null
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
