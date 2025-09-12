-- Create food_items table for nutrition database
CREATE TABLE public.food_items (
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

-- Create nutrition_goals table
CREATE TABLE public.nutrition_goals (
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

-- Create meal_entries table
CREATE TABLE public.meal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id),
  quantity_grams NUMERIC NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'team', 'global')),
  category TEXT NOT NULL, -- fitness, nutrition, habit, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_value NUMERIC,
  goal_unit TEXT, -- kg, minutes, count, etc.
  prize_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
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

-- Create challenge_progress table
CREATE TABLE public.challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  progress_value NUMERIC NOT NULL,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for chat system
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  student_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, student_id)
);

-- Create messages table for chat system
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL, -- references auth.users.id
  sender_type TEXT NOT NULL CHECK (sender_type IN ('trainer', 'student')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_items (public read)
CREATE POLICY "Anyone can view food items" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Trainers can manage food items" ON public.food_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for nutrition_goals
CREATE POLICY "Trainers can manage nutrition goals" ON public.nutrition_goals 
FOR ALL 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for meal_entries
CREATE POLICY "Trainers can view student meal entries" ON public.meal_entries 
FOR ALL 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    JOIN public.profiles p ON s.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for challenges
CREATE POLICY "Trainers can view their challenges" ON public.challenges 
FOR SELECT 
USING (
  trainer_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage their challenges" ON public.challenges 
FOR ALL 
USING (
  trainer_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for challenge_participants
CREATE POLICY "Trainers can manage challenge participants" ON public.challenge_participants 
FOR ALL 
USING (
  challenge_id IN (
    SELECT c.id FROM public.challenges c 
    JOIN public.profiles p ON c.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for challenge_progress
CREATE POLICY "Trainers can view challenge progress" ON public.challenge_progress 
FOR ALL 
USING (
  participant_id IN (
    SELECT cp.id FROM public.challenge_participants cp 
    JOIN public.challenges c ON cp.challenge_id = c.id 
    JOIN public.profiles p ON c.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for conversations
CREATE POLICY "Trainers can view their conversations" ON public.conversations 
FOR ALL 
USING (
  trainer_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for messages
CREATE POLICY "Trainers can view messages in their conversations" ON public.messages 
FOR ALL 
USING (
  conversation_id IN (
    SELECT c.id FROM public.conversations c 
    JOIN public.profiles p ON c.trainer_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at
  BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_participants_updated_at
  BEFORE UPDATE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();