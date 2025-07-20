export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          bucket_id: string
          chat_id: string
          content_type: string
          created_at: string
          filename: string
          id: string
          original_name: string
          size: number
          storage_path: string
          url: string
          user_id: string
          version: number
        }
        Insert: {
          bucket_id?: string
          chat_id: string
          content_type: string
          created_at?: string
          filename: string
          id?: string
          original_name: string
          size: number
          storage_path: string
          url: string
          user_id: string
          version?: number
        }
        Update: {
          bucket_id?: string
          chat_id?: string
          content_type?: string
          created_at?: string
          filename?: string
          id?: string
          original_name?: string
          size?: number
          storage_path?: string
          url?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_conversations: {
        Row: {
          created_at: string
          id: string
          memory_profile_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_profile_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_profile_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_conversations_memory_profile_id_fkey"
            columns: ["memory_profile_id"]
            isOneToOne: false
            referencedRelation: "memory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          memory_conversation_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          memory_conversation_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memory_conversation_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_messages_memory_conversation_id_fkey"
            columns: ["memory_conversation_id"]
            isOneToOne: false
            referencedRelation: "memory_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_profiles: {
        Row: {
          average_message_length: number | null
          capitalization_style: string | null
          common_words: string[] | null
          communication_patterns: string[] | null
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          description: string | null
          emoticons_used: string[] | null
          farewell_patterns: string[] | null
          greeting_patterns: string[] | null
          id: string
          message_timing: string[] | null
          name: string
          punctuation_style: string[] | null
          question_style: string[] | null
          relationship: string | null
          response_style: string[] | null
          total_messages: number | null
          training_status: string | null
          typical_phrases: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_message_length?: number | null
          capitalization_style?: string | null
          common_words?: string[] | null
          communication_patterns?: string[] | null
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string | null
          emoticons_used?: string[] | null
          farewell_patterns?: string[] | null
          greeting_patterns?: string[] | null
          id?: string
          message_timing?: string[] | null
          name: string
          punctuation_style?: string[] | null
          question_style?: string[] | null
          relationship?: string | null
          response_style?: string[] | null
          total_messages?: number | null
          training_status?: string | null
          typical_phrases?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_message_length?: number | null
          capitalization_style?: string | null
          common_words?: string[] | null
          communication_patterns?: string[] | null
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string | null
          emoticons_used?: string[] | null
          farewell_patterns?: string[] | null
          greeting_patterns?: string[] | null
          id?: string
          message_timing?: string[] | null
          name?: string
          punctuation_style?: string[] | null
          question_style?: string[] | null
          relationship?: string | null
          response_style?: string[] | null
          total_messages?: number | null
          training_status?: string | null
          typical_phrases?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          memory_profile_id: string
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          memory_profile_id: string
          session_end?: string | null
          session_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          memory_profile_id?: string
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_sessions_memory_profile_id_fkey"
            columns: ["memory_profile_id"]
            isOneToOne: false
            referencedRelation: "memory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          role: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_usage: {
        Row: {
          created_at: string
          id: string
          last_session_date: string | null
          sessions_used: number | null
          updated_at: string
          usage_month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_session_date?: string | null
          sessions_used?: number | null
          updated_at?: string
          usage_month: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_session_date?: string | null
          sessions_used?: number | null
          updated_at?: string
          usage_month?: string
          user_id?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          created_at: string
          description: string | null
          document_created_at: string
          document_id: string
          id: string
          is_resolved: boolean
          original_text: string
          suggested_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_created_at: string
          document_id: string
          id?: string
          is_resolved?: boolean
          original_text: string
          suggested_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_created_at?: string
          document_id?: string
          id?: string
          is_resolved?: boolean
          original_text?: string
          suggested_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_document_id_document_created_at_fkey"
            columns: ["document_id", "document_created_at"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id", "created_at"]
          },
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          memory_profile_id: string
          message_order: number
          original_timestamp: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          memory_profile_id: string
          message_order: number
          original_timestamp: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memory_profile_id?: string
          message_order?: number
          original_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_messages_memory_profile_id_fkey"
            columns: ["memory_profile_id"]
            isOneToOne: false
            referencedRelation: "memory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          chat_id: string
          is_upvoted: boolean
          message_id: string
        }
        Insert: {
          chat_id: string
          is_upvoted: boolean
          message_id: string
        }
        Update: {
          chat_id?: string
          is_upvoted?: boolean
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_document_latest_version: {
        Args: { doc_id: string }
        Returns: string
      }
      get_latest_document: {
        Args: { doc_id: string; auth_user_id: string }
        Returns: {
          id: string
          user_id: string
          title: string
          content: string
          created_at: string
        }[]
      }
      get_next_file_version: {
        Args: { p_bucket_id: string; p_storage_path: string }
        Returns: number
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
