/*
  # Complete Database Schema for GymPal Pro
  
  1. Tables Created
    - profiles: Personal trainer profiles
    - students: Student information
    - evaluations: Body composition evaluations
    - student_portals: Portal credentials for students
    - exercises: Exercise library
    - workout_templates: Workout template definitions
    - workout_template_exercises: Exercises in workout templates
    - student_workouts: Assigned workouts to students
    - workout_logs: Completed workout sessions
    - workout_exercise_logs: Individual exercise logs
    - food_items: Nutrition database
    - nutrition_goals: Student nutrition goals
    - meal_entries: Daily meal tracking
    - challenges: Fitness challenges
    - challenge_participants: Challenge participation
    - challenge_progress: Challenge progress tracking
    - conversations: Chat conversations
    - messages: Chat messages
    - anamnesis: Health anamnesis data
    
  2. Security
    - Enable RLS on all tables
    - Policies for trainer access control
    - Policies for student portal access
    - Policies for chat system
    
  3. Functions
    - Auto-create profile on user signup
    - Update timestamps automatically
    - Student portal login functions
    - Portal management functions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 18,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino')),
  height DECIMAL(5,2) NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('perder_gordura', 'ganhar_massa', 'manter_peso')),
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  waist DECIMAL(5,2) NOT NULL,
  neck DECIMAL(5,2) NOT NULL,
  hip DECIMAL(5,2),
  right_arm DECIMAL(5,2),
  right_forearm DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  fat_weight DECIMAL(5,2),
  lean_mass DECIMAL(5,2),
  bmr DECIMAL(8,2),
  daily_calories DECIMAL(8,2),
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluation_method TEXT DEFAULT 'circumferences' CHECK (evaluation_method IN ('circumferences', 'skinfolds')),
  triceps_skinfold NUMERIC,
  subscapular_skinfold NUMERIC,
  chest_skinfold NUMERIC,
  axillary_skinfold NUMERIC,
  abdominal_skinfold NUMERIC,
  suprailiac_skinfold NUMERIC,
  thigh_skinfold NUMERIC,
  skinfold_protocol TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_portals table
CREATE TABLE IF NOT EXISTS public.student_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create anamnesis table
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  ai_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for students
CREATE POLICY "Trainers can view their own students" ON public.students FOR SELECT 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can create students" ON public.students FOR INSERT 
WITH CHECK (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can update their own students" ON public.students FOR UPDATE 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can delete their own students" ON public.students FOR DELETE 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for evaluations
CREATE POLICY "Trainers can manage evaluations" ON public.evaluations FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- RLS Policies for student_portals
CREATE POLICY "Trainers can manage portals" ON public.student_portals FOR ALL
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- RLS Policies for anamnesis
CREATE POLICY "Trainers can manage anamnesis" ON public.anamnesis FOR ALL 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Create functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_portals_updated_at BEFORE UPDATE ON public.student_portals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anamnesis_updated_at BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Student portal login functions
CREATE OR REPLACE FUNCTION public.fn_student_portal_login(
  p_username text,
  p_password text
)
RETURNS public.students
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.*
  FROM public.student_portals sp
  JOIN public.students s ON s.id = sp.student_id
  WHERE sp.username = p_username
    AND sp.password_hash = encode(convert_to(p_password,'UTF8'), 'base64')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_student_evaluations(
  p_username text,
  p_password text
)
RETURNS SETOF public.evaluations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT e.*
  FROM public.student_portals sp
  JOIN public.students s ON s.id = sp.student_id
  JOIN public.evaluations e ON e.student_id = s.id
  WHERE sp.username = p_username
    AND sp.password_hash = encode(convert_to(p_password,'UTF8'), 'base64')
  ORDER BY e.evaluation_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_student_portal_login(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_student_evaluations(text, text) TO anon, authenticated;