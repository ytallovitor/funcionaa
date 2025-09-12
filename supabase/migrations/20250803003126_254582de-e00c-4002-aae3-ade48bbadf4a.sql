-- Create profiles table for personal trainers
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino')),
  height DECIMAL(5,2) NOT NULL, -- em cm
  goal TEXT NOT NULL CHECK (goal IN ('perder_gordura', 'ganhar_massa', 'manter_peso')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL, -- em kg
  waist DECIMAL(5,2) NOT NULL, -- cintura em cm
  neck DECIMAL(5,2) NOT NULL, -- pescoço em cm
  hip DECIMAL(5,2), -- quadril em cm (opcional para homens)
  right_arm DECIMAL(5,2), -- braço direito em cm
  right_forearm DECIMAL(5,2), -- antebraço direito em cm
  body_fat_percentage DECIMAL(5,2), -- calculado automaticamente
  fat_weight DECIMAL(5,2), -- peso de gordura calculado
  lean_mass DECIMAL(5,2), -- massa magra calculada
  bmr DECIMAL(8,2), -- taxa metabólica basal
  daily_calories DECIMAL(8,2), -- gasto calórico total diário
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for students
CREATE POLICY "Trainers can view their own students" 
ON public.students 
FOR SELECT 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can create students" 
ON public.students 
FOR INSERT 
WITH CHECK (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can update their own students" 
ON public.students 
FOR UPDATE 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Trainers can delete their own students" 
ON public.students 
FOR DELETE 
USING (trainer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for evaluations
CREATE POLICY "Trainers can view evaluations of their students" 
ON public.evaluations 
FOR SELECT 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Trainers can create evaluations for their students" 
ON public.evaluations 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Trainers can update evaluations of their students" 
ON public.evaluations 
FOR UPDATE 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Trainers can delete evaluations of their students" 
ON public.evaluations 
FOR DELETE 
USING (student_id IN (
  SELECT s.id FROM public.students s 
  JOIN public.profiles p ON s.trainer_id = p.id 
  WHERE p.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();