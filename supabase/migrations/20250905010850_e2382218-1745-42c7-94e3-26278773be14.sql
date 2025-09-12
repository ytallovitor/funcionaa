-- Create exercises table for the exercise library
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  equipment TEXT[] NOT NULL,
  instructions TEXT[] NOT NULL,
  tips TEXT[],
  duration INTEGER DEFAULT 0, -- in seconds for cardio, 0 for strength
  sets INTEGER,
  reps INTEGER,
  rest_time INTEGER, -- in seconds
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_templates table
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  estimated_duration INTEGER, -- in minutes
  equipment_needed TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_template_exercises table (junction table)
CREATE TABLE public.workout_template_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC,
  rest_time INTEGER, -- in seconds
  duration INTEGER, -- in seconds for cardio
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_workouts table (assigned workouts)
CREATE TABLE public.student_workouts (
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

-- Create workout_logs table (completed workout sessions)
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  workout_template_id UUID NOT NULL REFERENCES public.workout_templates(id),
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in minutes
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_exercise_logs table
CREATE TABLE public.workout_exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  sets_completed INTEGER DEFAULT 0,
  reps_completed INTEGER[],
  weight_used NUMERIC[],
  duration_seconds INTEGER,
  rest_time INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises (public read, trainers can manage)
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

CREATE POLICY "Trainers can manage exercises" ON public.exercises 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for workout_templates
CREATE POLICY "Trainers can view their own templates" ON public.workout_templates 
FOR SELECT 
USING (
  trainer_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  ) OR is_public = true
);

CREATE POLICY "Trainers can manage their own templates" ON public.workout_templates 
FOR ALL 
USING (
  trainer_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for workout_template_exercises
CREATE POLICY "View template exercises" ON public.workout_template_exercises 
FOR SELECT 
USING (
  workout_template_id IN (
    SELECT wt.id FROM public.workout_templates wt 
    JOIN public.profiles p ON wt.trainer_id = p.id 
    WHERE p.user_id = auth.uid() OR wt.is_public = true
  )
);

CREATE POLICY "Trainers can manage template exercises" ON public.workout_template_exercises 
FOR ALL 
USING (
  workout_template_id IN (
    SELECT wt.id FROM public.workout_templates wt 
    JOIN public.profiles p ON wt.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for student_workouts
CREATE POLICY "Trainers can manage student workouts" ON public.student_workouts 
FOR ALL 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for workout_logs
CREATE POLICY "Trainers can view student workout logs" ON public.workout_logs 
FOR SELECT 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage workout logs" ON public.workout_logs 
FOR ALL 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for workout_exercise_logs
CREATE POLICY "Trainers can view exercise logs" ON public.workout_exercise_logs 
FOR SELECT 
USING (
  workout_log_id IN (
    SELECT wl.id FROM public.workout_logs wl 
    JOIN public.students s ON wl.student_id = s.id 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage exercise logs" ON public.workout_exercise_logs 
FOR ALL 
USING (
  workout_log_id IN (
    SELECT wl.id FROM public.workout_logs wl 
    JOIN public.students s ON wl.student_id = s.id 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_workouts_updated_at
  BEFORE UPDATE ON public.student_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();