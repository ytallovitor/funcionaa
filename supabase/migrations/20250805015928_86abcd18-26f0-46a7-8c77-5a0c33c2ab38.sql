-- Add portal credentials table for students to access their data
CREATE TABLE public.student_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_portals ENABLE ROW LEVEL SECURITY;

-- Create policies for student_portals
CREATE POLICY "Trainers can manage portals for their students"
ON public.student_portals
FOR ALL
USING (
  student_id IN (
    SELECT s.id 
    FROM students s 
    JOIN profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Add evaluation method to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN evaluation_method TEXT DEFAULT 'circumferences' CHECK (evaluation_method IN ('circumferences', 'skinfolds'));

-- Add skinfold measurements columns
ALTER TABLE public.evaluations 
ADD COLUMN triceps_skinfold NUMERIC,
ADD COLUMN subscapular_skinfold NUMERIC,
ADD COLUMN chest_skinfold NUMERIC,
ADD COLUMN axillary_skinfold NUMERIC,
ADD COLUMN abdominal_skinfold NUMERIC,
ADD COLUMN suprailiac_skinfold NUMERIC,
ADD COLUMN thigh_skinfold NUMERIC,
ADD COLUMN skinfold_protocol TEXT;