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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {

      skills: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name?: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }

      interests: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name?: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }

      profile_skills: {
        Row: { profile_id: string; skill_id: string; proficiency: number }
        Insert: { profile_id?: string; skill_id?: string; proficiency?: number }
        Update: { profile_id?: string; skill_id?: string; proficiency?: number }
        Relationships: []
      }

      profile_interests: {
        Row: { profile_id: string; interest_id: string }
        Insert: { profile_id?: string; interest_id?: string }
        Update: { profile_id?: string; interest_id?: string }
        Relationships: []
      }
      profile_event_interests: {
        Row: { profile_id: string; event_id: string; created_at: string }
        Insert: { profile_id?: string; event_id: string; created_at?: string }
        Update: { profile_id?: string; event_id?: string; created_at?: string }
        Relationships: []
      }

      event_skills: {
        Row: { event_id: string; skill_id: string }
        Insert: { event_id?: string; skill_id?: string }
        Update: { event_id?: string; skill_id?: string }
        Relationships: [{ foreignKeyName: "event_skills_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }]
      }

      team_skills: {
        Row: { team_id: string; skill_id: string }
        Insert: { team_id?: string; skill_id?: string }
        Update: { team_id?: string; skill_id?: string }
        Relationships: []
      }

      notifications: {
        Row: { id: string; user_id: string; message: string; destination: string; created_at: string; read_at: string | null }
        Insert: { id?: string; user_id?: string; message?: string; destination?: string; created_at?: string; read_at?: string | null }
        Update: { id?: string; user_id?: string; message?: string; destination?: string; created_at?: string; read_at?: string | null }
        Relationships: []
      }

      team_invitations: {
        Row: { id: string; team_id: string; recipient_id: string; invited_by: string; status: string; created_at: string; decided_at: string | null }
        Insert: { id?: string; team_id?: string; recipient_id?: string; invited_by?: string; status?: string; created_at?: string; decided_at?: string | null }
        Update: { id?: string; team_id?: string; recipient_id?: string; invited_by?: string; status?: string; created_at?: string; decided_at?: string | null }
        Relationships: []
      }

      reports: {
        Row: { id: string; reporter_id: string; event_id: string | null; team_id: string | null; reason: string; status: string; created_at: string; resolved_at: string | null }
        Insert: { reporter_id?: string; event_id?: string | null; team_id?: string | null; reason?: string }
        Update: { id?: string; reporter_id?: string; event_id?: string | null; team_id?: string | null; reason?: string; status?: string; created_at?: string; resolved_at?: string | null }
        Relationships: []
      }

      moderation_actions: {
        Row: { id: string; actor_id: string | null; event_id: string | null; report_id: string | null; reason: string; decision: string; created_at: string }
        Insert: { id?: string; actor_id?: string | null; event_id?: string | null; report_id?: string | null; reason?: string; decision?: string; created_at?: string }
        Update: { id?: string; actor_id?: string | null; event_id?: string | null; report_id?: string | null; reason?: string; decision?: string; created_at?: string }
        Relationships: []
      }

      platform_settings: {
        Row: { key: string; value: string; updated_at: string }
        Insert: { key?: string; value?: string; updated_at?: string }
        Update: { key?: string; value?: string; updated_at?: string }
        Relationships: []
      }
      student_approvals: {
        Row: { user_id: string; university_id: string; university_email: string; status: string; requested_at: string; reviewed_at: string | null; reviewed_by: string | null; review_reason: string | null }
        Insert: never
        Update: never
        Relationships: []
      }
      account_access: {
        Row: {
          onboarded_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          onboarded_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          onboarded_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      event_bookmarks: {
        Row: {
          attendance_plan: "interested" | "planning" | "registered"
          created_at: string
          event_id: string
          personal_note: string
          user_id: string
        }
        Insert: {
          attendance_plan?: "interested" | "planning" | "registered"
          created_at?: string
          event_id: string
          personal_note?: string
          user_id?: string
        }
        Update: {
          attendance_plan?: "interested" | "planning" | "registered"
          created_at?: string
          event_id?: string
          personal_note?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          author_id: string
          category: string
          cover_path: string | null
          created_at: string
          description: string
          eligibility: string | null
          ends_at: string
          format: string
          id: string
          location: string | null
          max_team_size: number
          min_team_size: number
          moderation_status: string
          official_url: string | null
          organizer: string
          prizes: string | null
          registration_deadline: string | null
          registration_url: string | null
          slug: string
          source_status: string
          source_url: string
          starts_at: string
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string
          category: string
          cover_path?: string | null
          created_at?: string
          description: string
          eligibility?: string | null
          ends_at: string
          format: string
          id?: string
          location?: string | null
          max_team_size?: number
          min_team_size?: number
          moderation_status?: string
          official_url?: string | null
          organizer: string
          prizes?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          slug: string
          source_status?: string
          source_url: string
          starts_at: string
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          cover_path?: string | null
          created_at?: string
          description?: string
          eligibility?: string | null
          ends_at?: string
          format?: string
          id?: string
          location?: string | null
          max_team_size?: number
          min_team_size?: number
          moderation_status?: string
          official_url?: string | null
          organizer?: string
          prizes?: string | null
          registration_deadline?: string | null
          registration_url?: string | null
          slug?: string
          source_status?: string
          source_url?: string
          starts_at?: string
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          discoverable: boolean
          experience: string | null
          preferred_roles: string[]
          academic_year: string | null
          availability: string | null
          avatar_path: string | null
          bio: string | null
          created_at: string
          field_of_study: string | null
          full_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          portfolio_url: string | null
          university_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          discoverable?: boolean
          experience?: string | null
          preferred_roles?: string[]
          academic_year?: string | null
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          field_of_study?: string | null
          full_name: string
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          university_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          discoverable?: boolean
          experience?: string | null
          preferred_roles?: string[]
          academic_year?: string | null
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          field_of_study?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          university_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_applications: {
        Row: {
          applicant_id: string
          created_at: string
          decided_at: string | null
          id: string
          message: string
          status: string
          team_id: string
        }
        Insert: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          message: string
          status?: string
          team_id: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          open_positions: string
          staff_restricted: boolean
          created_at: string
          description: string
          event_id: string
          id: string
          leader_id: string
          max_size: number
          name: string
          recruitment_open: boolean
          updated_at: string
          visibility: string
        }
        Insert: {
          open_positions?: string
          staff_restricted?: boolean
          created_at?: string
          description: string
          event_id: string
          id?: string
          leader_id?: string
          max_size: number
          name: string
          recruitment_open?: boolean
          updated_at?: string
          visibility?: string
        }
        Update: {
          open_positions?: string
          staff_restricted?: boolean
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          leader_id?: string
          max_size?: number
          name?: string
          recruitment_open?: boolean
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      university_email_domains: {
        Row: {
          active: boolean
          created_at: string
          domain: string
          id: string
          university_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          domain: string
          id?: string
          university_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          domain?: string
          id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_email_domains_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          academic_year: string
          created_at: string
          evidence_path: string
          field_of_study: string
          id: string
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          university_id: string
          user_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          evidence_path: string
          field_of_study: string
          id?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          university_id: string
          user_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          evidence_path?: string
          field_of_study?: string
          id?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      review_student: { Args: { member: string; approved: boolean; reason: string }; Returns: undefined }
      complete_student_onboarding: { Args: { name: string; handle: string; field: string; selected_interests: string[] }; Returns: undefined }

      cancel_invitation: { Args: { invitation: string }; Returns: undefined }
      restrict_team: { Args: { team: string; reason: string }; Returns: undefined }
      unpublish_event: { Args: { event: string; reason: string }; Returns: undefined }

      submit_verification: {
        Args: { academic_year: string; field_of_study: string; evidence: string }
        Returns: undefined
      }

      review_verification: {
        Args: { request_id: string; approved: boolean; reason: string }
        Returns: undefined
      }

      save_profile_taxonomy: {
        Args: { skill_levels: Json; interests: string[] }
        Returns: undefined
      }

      submit_event: {
        Args: { details: Json; skills: string[] }
        Returns: string
      }

      review_event: {
        Args: { event_id: string; approved: boolean; reason: string }
        Returns: undefined
      }

      save_team: {
        Args: { team: string | null; event: string | null; title: string; description: string; capacity: number; positions: string; recruiting: boolean; private_team: boolean; skills: string[] }
        Returns: string
      }

      invite_member: {
        Args: { team: string; recipient: string }
        Returns: undefined
      }

      respond_invitation: {
        Args: { invitation: string; accept: boolean }
        Returns: undefined
      }

      manage_member: {
        Args: { team: string; member: string; transfer: boolean }
        Returns: undefined
      }

      read_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }

      close_report: {
        Args: { report: string; reason: string }
        Returns: undefined
      }

      staff_catalog: {
        Args: { kind: string; name: string; parent: string | null; active: boolean }
        Returns: undefined
      }

      staff_account: {
        Args: { member: string; status: string | null; role: string | null }
        Returns: undefined
      }

      save_announcement: {
        Args: { message: string }
        Returns: undefined
      }
      review_application: {
        Args: { accept: boolean; application_id: string }
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
    Enums: {},
  },
} as const
