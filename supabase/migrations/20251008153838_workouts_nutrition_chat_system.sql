/*
  # Workouts, Nutrition, Chat and Challenges System
  
  1. New Tables
    - exercises: Exercise library with details
    - workout_templates: Reusable workout templates
    - workout_template_exercises: Exercises within templates
    - student_workouts: Workouts assigned to students
    - workout_logs: Completed workout sessions
    - workout_exercise_logs: Individual exercise performance logs
    - food_items: Nutrition database
    - nutrition_goals: Student nutrition targets
    - meal_entries: Daily food intake tracking
    - challenges: Fitness challenges
    - challenge_participants: Students in challenges
    - challenge_progress: Challenge progress tracking
    - conversations: Chat conversations between trainers and students
    - messages: Individual chat messages
    
  2. Security
    - Enable RLS on all tables
    - Policies for trainer-student data access
    - Policies for chat system
    - Public read access for exercises and food items
    
  3. Important Notes
    - Exercises are publicly viewable
    - Trainers can only manage their own students' data
    - Chat system supports real-time messaging
    - Nutrition tracking with macro nutrients
*/

-- EXERCISES AND WORKOUTS TABLES

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  equipment TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  duration INTEGER DEFAULT 0,
  sets INTEGER,
  reps INTEGER,
  rest_time INTEGER,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  estimated_duration INTEGER,
  equipment_needed TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC,
  rest_time INTEGER,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  workout_template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  workout_template_id UUID NOT NULL REFERENCES public.workout_templates(id),
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  sets_completed INTEGER DEFAULT 0,
  reps_completed INTEGER[] DEFAULT '{}',
  weight_used NUMERIC[] DEFAULT '{}',
  duration_seconds INTEGER,
  rest_time INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NUTRITION TABLES

CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC NOT NULL,
  protein_per_100g NUMERIC NOT NULL,
  carbs_per_100g NUMERIC NOT NULL,
  fat_per_100g NUMERIC NOT NULL,
  fiber_per_100g NUMERIC DEFAULT 0,
  category TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nutrition_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC DEFAULT 25,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id),
  quantity_grams NUMERIC NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CHALLENGES TABLES

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'team', 'global')),
  category TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_value NUMERIC,
  goal_unit TEXT,
  prize_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  progress_value NUMERIC NOT NULL,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CHAT SYSTEM TABLES

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  student_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('trainer', 'student')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ENABLE RLS ON ALL TABLES

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Exercises (public read)
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Trainers can manage exercises" ON public.exercises FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Workout Templates
CREATE POLICY "Trainers can view templates" ON public.workout_templates FOR SELECT 
USING (trainer_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()) OR is_public = true);

CREATE POLICY "Trainers can manage their templates" ON public.workout_templates FOR ALL 
USING (trainer_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Template Exercises
CREATE POLICY "View template exercises" ON public.workout_template_exercises FOR SELECT 
USING (workout_template_id IN (
  SELECT wt.id FROM public.workout_templates wt 
  JOIN public.profiles p ON wt.trainer_id = p.id 
  WHERE p.user_id = auth.uid() OR wt.is_public = true
));

CREATE POLICY "Trainers manage template exercises" ON public.workout_template_exercises FOR ALL 
USING (workout_template_id IN (
  SELECT wt.id FROM public.workout_templates wt 
  JOIN public.profiles p ON wt.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Student Workouts
CREATE POLICY "Trainers manage student workouts" ON public.student_workouts FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Workout Logs
CREATE POLICY "Trainers manage workout logs" ON public.workout_logs FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Exercise Logs
CREATE POLICY "Trainers manage exercise logs" ON public.workout_exercise_logs FOR ALL 
USING (workout_log_id IN (
  SELECT wl.id FROM public.workout_logs wl 
  JOIN public.students s ON wl.student_id = s.id 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Food Items (public read)
CREATE POLICY "Anyone can view food items" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Trainers can manage food items" ON public.food_items FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Nutrition Goals
CREATE POLICY "Trainers manage nutrition goals" ON public.nutrition_goals FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Meal Entries
CREATE POLICY "Trainers manage meal entries" ON public.meal_entries FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Challenges
CREATE POLICY "Trainers manage challenges" ON public.challenges FOR ALL 
USING (trainer_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Challenge Participants
CREATE POLICY "Trainers manage participants" ON public.challenge_participants FOR ALL 
USING (challenge_id IN (
  SELECT c.id FROM public.challenges c 
  JOIN public.profiles p ON c.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Challenge Progress
CREATE POLICY "Trainers view progress" ON public.challenge_progress FOR ALL 
USING (participant_id IN (
  SELECT cp.id FROM public.challenge_participants cp 
  JOIN public.challenges c ON cp.challenge_id = c.id 
  JOIN public.profiles p ON c.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Conversations
CREATE POLICY "Trainers manage conversations" ON public.conversations FOR ALL 
USING (trainer_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Messages
CREATE POLICY "Trainers manage messages" ON public.messages FOR ALL 
USING (conversation_id IN (
  SELECT c.id FROM public.conversations c 
  JOIN public.profiles p ON c.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- CREATE TRIGGERS FOR UPDATED_AT

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_workouts_updated_at BEFORE UPDATE ON public.student_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_participants_updated_at BEFORE UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENABLE REALTIME FOR IMPORTANT TABLES

ALTER TABLE public.exercises REPLICA IDENTITY FULL;
ALTER TABLE public.workout_templates REPLICA IDENTITY FULL;
ALTER TABLE public.student_workouts REPLICA IDENTITY FULL;
ALTER TABLE public.workout_logs REPLICA IDENTITY FULL;
ALTER TABLE public.meal_entries REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;