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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      inbox_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          result: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          result?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          result?: Json | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          access_status: string | null
          access_token: string
          address: string
          confidence: number
          created_at: string
          customer_name: string
          description: string
          duration_min: number
          id: string
          is_emergency: boolean
          missing_fields: string[]
          phone: string
          photo_path: string | null
          ref: string
          scheduled_at: string | null
          site_visit: boolean
          status: Database["public"]["Enums"]["job_status"]
          title: string
          urgency: string
          value: number
          zone: string
        }
        Insert: {
          access_status?: string | null
          access_token?: string
          address?: string
          confidence?: number
          created_at?: string
          customer_name: string
          description?: string
          duration_min?: number
          id?: string
          is_emergency?: boolean
          missing_fields?: string[]
          phone?: string
          photo_path?: string | null
          ref?: string
          scheduled_at?: string | null
          site_visit?: boolean
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          urgency?: string
          value?: number
          zone?: string
        }
        Update: {
          access_status?: string | null
          access_token?: string
          address?: string
          confidence?: number
          created_at?: string
          customer_name?: string
          description?: string
          duration_min?: number
          id?: string
          is_emergency?: boolean
          missing_fields?: string[]
          phone?: string
          photo_path?: string | null
          ref?: string
          scheduled_at?: string | null
          site_visit?: boolean
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          urgency?: string
          value?: number
          zone?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          name: string
          stage: string
          value: number
          work: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          stage?: string
          value?: number
          work: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          stage?: string
          value?: number
          work?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          breakdown: Json
          created_at: string
          duration_min: number
          expires_at: string
          id: string
          score: number
          slot_start: string
          source_job_id: string | null
          status: string
          token: string
          waitlist_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          duration_min: number
          expires_at: string
          id?: string
          score?: number
          slot_start: string
          source_job_id?: string | null
          status?: string
          token?: string
          waitlist_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          duration_min?: number
          expires_at?: string
          id?: string
          score?: number
          slot_start?: string
          source_job_id?: string | null
          status?: string
          token?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_source_job_id_fkey"
            columns: ["source_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          checklist: Json
          created_at: string
          done: boolean
          end_hour: number
          id: string
          is_extension: boolean
          notes: string
          project_id: string
          start_hour: number
          title: string
          work_date: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          done?: boolean
          end_hour?: number
          id?: string
          is_extension?: boolean
          notes?: string
          project_id: string
          start_hour?: number
          title: string
          work_date: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          done?: boolean
          end_hour?: number
          id?: string
          is_extension?: boolean
          notes?: string
          project_id?: string
          start_hour?: number
          title?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          budget: string
          created_at: string
          customer_name: string
          description: string
          id: string
          phone: string
          planned_days: number
          quote: Json
          ref: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          worked_rest_dates: string[]
        }
        Insert: {
          address?: string
          budget?: string
          created_at?: string
          customer_name: string
          description?: string
          id?: string
          phone?: string
          planned_days?: number
          quote?: Json
          ref?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          worked_rest_dates?: string[]
        }
        Update: {
          address?: string
          budget?: string
          created_at?: string
          customer_name?: string
          description?: string
          id?: string
          phone?: string
          planned_days?: number
          quote?: Json
          ref?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          worked_rest_dates?: string[]
        }
        Relationships: []
      }
      rot_records: {
        Row: {
          created_at: string
          customer: string
          id: string
          labor: number
          materials: number
          status: string
          work: string
        }
        Insert: {
          created_at?: string
          customer: string
          id?: string
          labor?: number
          materials?: number
          status?: string
          work: string
        }
        Update: {
          created_at?: string
          customer?: string
          id?: string
          labor?: number
          materials?: number
          status?: string
          work?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          business_name: string
          clock_offset_minutes: number
          emergency_buffer_min: number
          hourly_rate: number
          id: number
          owner_name: string
          rest_days: number[]
          service_area: string
          work_end_hour: number
          work_start_hour: number
        }
        Insert: {
          business_name?: string
          clock_offset_minutes?: number
          emergency_buffer_min?: number
          hourly_rate?: number
          id?: number
          owner_name?: string
          rest_days?: number[]
          service_area?: string
          work_end_hour?: number
          work_start_hour?: number
        }
        Update: {
          business_name?: string
          clock_offset_minutes?: number
          emergency_buffer_min?: number
          hourly_rate?: number
          id?: number
          owner_name?: string
          rest_days?: number[]
          service_area?: string
          work_end_hour?: number
          work_start_hour?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          created_at: string
          customer_name: string
          duration_min: number
          flexibility: string
          id: string
          phone: string
          status: string
          title: string
          urgency: string
          value: number
          zone: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          duration_min?: number
          flexibility?: string
          id?: string
          phone?: string
          status?: string
          title: string
          urgency?: string
          value?: number
          zone: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          duration_min?: number
          flexibility?: string
          id?: string
          phone?: string
          status?: string
          title?: string
          urgency?: string
          value?: number
          zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _seed_demo: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_demo: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "owner"
      job_status:
        | "new"
        | "qualified"
        | "held"
        | "confirmed"
        | "access_confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "expired"
        | "waitlisted"
        | "needs_assessment"
      project_status:
        | "project_request"
        | "site_visit_requested"
        | "site_visit_scheduled"
        | "owner_review"
        | "project_approved"
        | "scheduled"
        | "in_progress"
        | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner"],
      job_status: [
        "new",
        "qualified",
        "held",
        "confirmed",
        "access_confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "expired",
        "waitlisted",
        "needs_assessment",
      ],
      project_status: [
        "project_request",
        "site_visit_requested",
        "site_visit_scheduled",
        "owner_review",
        "project_approved",
        "scheduled",
        "in_progress",
        "completed",
      ],
    },
  },
} as const
