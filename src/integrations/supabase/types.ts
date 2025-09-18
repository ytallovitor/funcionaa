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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      challenge_participants: {
        Row: {
          challenge_id: string
          created_at: string
          current_progress: number | null
          id: string
          joined_date: string
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          current_progress?: number | null
          id?: string
          joined_date?: string
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          current_progress?: number | null
          id?: string
          joined_date?: string
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          participant_id: string
          progress_date: string
          progress_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          participant_id: string
          progress_date?: string
          progress_value: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          participant_id?: string
          progress_date?: string
          progress_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: string
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string
          goal_unit: string | null
          goal_value: number | null
          id: string
          is_active: boolean | null
          prize_description: string | null
          start_date: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          category: string
          challenge_type: string
          created_at?: string
          description?: string | null
          end_date: string
          goal_unit?: string | null
          goal_value?: number | null
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          goal_unit?: string | null
          goal_value?: number | null
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          student_id: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          student_id: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          student_id?: string
          trainer_id?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          abdominal_skinfold: number | null
          axillary_skinfold: number | null
          bmr: number | null
          body_fat_percentage: number | null
          chest_skinfold: number | null
          created_at: string
          daily_calories: number | null
          evaluation_date: string
          evaluation_method: string | null
          fat_weight: number | null
          hip: number | null
          id: string
          lean_mass: number | null
          neck: number
          right_arm: number | null
          right_forearm: number | null
          skinfold_protocol: string | null
          student_id: string
          subscapular_skinfold: number | null
          suprailiac_skinfold: number | null
          thigh_skinfold: number | null
          triceps_skinfold: number | null
          waist: number
          weight: number
        }
        Insert: {
          abdominal_skinfold?: number | null
          axillary_skinfold?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          chest_skinfold?: number | null
          created_at?: string
          daily_calories?: number | null
          evaluation_date?: string
          evaluation_method?: string | null
          fat_weight?: number | null
          hip?: number | null
          id?: string
          lean_mass?: number | null
          neck: number
          right_arm?: number | null
          right_forearm?: number | null
          skinfold_protocol?: string | null
          student_id: string
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          waist: number
          weight: number
        }
        Update: {
          abdominal_skinfold?: number | null
          axillary_skinfold?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          chest_skinfold?: number | null
          created_at?: string
          daily_calories?: number | null
          evaluation_date?: string
          evaluation_method?: string | null
          fat_weight?: number | null
          hip?: number | null
          id?: string
          lean_mass?: number | null
          neck?: number
          right_arm?: number | null
          right_forearm?: number | null
          skinfold_protocol?: string | null
          student_id?: string
          subscapular_skinfold?: number | null
          suprailiac_skinfold?: number | null
          thigh_skinfold?: number | null
          triceps_skinfold?: number | null
          waist?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          duration: number | null
          equipment: string[]
          id: string
          image_url: string | null
          instructions: string[]
          muscle_groups: string[]
          name: string
          reps: number | null
          rest_time: number | null
          sets: number | null
          tips: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          difficulty: string
          duration?: number | null
          equipment: string[]
          id?: string
          image_url?: string | null
          instructions: string[]
          muscle_groups: string[]
          name: string
          reps?: number | null
          rest_time?: number | null
          sets?: number | null
          tips?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          duration?: number | null
          equipment?: string[]
          id?: string
          image_url?: string | null
          instructions?: string[]
          muscle_groups?: string[]
          name?: string
          reps?: number | null
          rest_time?: number | null
          sets?: number | null
          tips?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          created_at: string
          fat_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          created_at?: string
          fat_per_100g: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string
          created_at?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          updated_at?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          meal_date: string
          meal_type: string
          quantity_grams: number
          student_id: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          meal_date?: string
          meal_type: string
          quantity_grams: number
          student_id: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          meal_date?: string
          meal_type?: string
          quantity_grams?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          end_date: string | null
          fat: number
          fiber: number | null
          id: string
          is_active: boolean | null
          protein: number
          start_date: string
          student_id: string
          updated_at: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          end_date?: string | null
          fat: number
          fiber?: number | null
          id?: string
          is_active?: boolean | null
          protein: number
          start_date?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          end_date?: string | null
          fat?: number
          fiber?: number | null
          id?: string
          is_active?: boolean | null
          protein?: number
          start_date?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string
          full_name: string
          gender: string | null
          height: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          full_name: string
          gender?: string | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_portals: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          student_id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          student_id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          student_id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_portals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_workouts: {
        Row: {
          assigned_date: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_time: string | null
          status: string | null
          student_id: string
          updated_at: string
          workout_template_id: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
          workout_template_id: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_time?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_workouts_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number
          birth_date: string | null
          created_at: string
          gender: string
          goal: string
          height: number
          id: string
          name: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          age: number
          birth_date?: string | null
          created_at?: string
          gender: string
          goal: string
          height: number
          id?: string
          name: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          birth_date?: string | null
          created_at?: string
          gender?: string
          goal?: string
          height?: number
          id?: string
          name?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          notes: string | null
          reps_completed: number[] | null
          rest_time: number | null
          sets_completed: number | null
          weight_used: number[] | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps_completed?: number[] | null
          rest_time?: number | null
          sets_completed?: number | null
          weight_used?: number[] | null
          workout_log_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps_completed?: number[] | null
          rest_time?: number | null
          sets_completed?: number | null
          weight_used?: number[] | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          rating: number | null
          start_time: string | null
          student_id: string
          total_duration: number | null
          workout_date: string
          workout_template_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          start_time?: string | null
          student_id: string
          total_duration?: number | null
          workout_date?: string
          workout_template_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          start_time?: string | null
          student_id?: string
          total_duration?: number | null
          workout_date?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          created_at: string
          duration: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_time: number | null
          sets: number | null
          weight_kg: number | null
          workout_template_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps?: number | null
          rest_time?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_template_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_time?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty: string
          equipment_needed: string[] | null
          estimated_duration: number | null
          id: string
          is_public: boolean | null
          name: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          difficulty: string
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_student_active_challenges: {
        Args: { p_password: string; p_username: string }
        Returns: {
          id: string
          challenge_id: string
          current_progress: number
          status: string
          challenges: Json
        }[]
      }
      fn_student_evaluations: {
        Args: { p_password: string; p_username: string }
        Returns: {
          abdominal_skinfold: number | null
          axillary_skinfold: number | null
          bmr: number | null
          body_fat_percentage: number | null
          chest_skinfold: number | null
          created_at: string
          daily_calories: number | null
          evaluation_date: string
          evaluation_method: string | null
          fat_weight: number | null
          hip: number | null
          id: string
          lean_mass: number | null
          neck: number
          right_arm: number | null
          right_forearm: number | null
          skinfold_protocol: string | null
          student_id: string
          subscapular_skinfold: number | null
          suprailiac_skinfold: number | null
          thigh_skinfold: number | null
          triceps_skinfold: number | null
          waist: number
          weight: number
        }[]
      }
      fn_student_meal_entries: {
        Args: { p_meal_date: string; p_password: string; p_username: string }
        Returns: {
          id: string
          food_item_id: string
          quantity_grams: number
          meal_type: string
          meal_date: string
          food_items: Json
        }[]
      }
      fn_student_nutrition_goals: {
        Args: { p_password: string; p_username: string }
        Returns: {
          calories: number
          carbs: number
          created_at: string
          end_date: string | null
          fat: number
          fiber: number | null
          id: string
          is_active: boolean | null
          protein: number
          start_date: string
          student_id: string
          updated_at: string
        }[]
      }
      fn_student_portal_login: {
        Args: { p_password: string; p_username: string }
        Returns: {
          age: number
          birth_date: string | null
          created_at: string
          gender: string
          goal: string
          height: number
          id: string
          name: string
          trainer_id: string
          updated_at: string
        }
      }
      fn_student_workouts: {
        Args: { p_password: string; p_username: string }
        Returns: {
          id: string
          name: string
          description: string
          category: string
          difficulty: string
          estimated_duration: number
          exercises: Json
        }[]
      }
      get_or_create_student_portal: {
        Args: {
          p_password_hash?: string
          p_student_id: string
          p_username?: string
        }
        Returns: {
          created_at: string
          id: string
          password_hash: string
          student_id: string
          updated_at: string
          username: string
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