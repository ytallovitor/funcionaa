-- Insert sample exercises into the database
INSERT INTO public.food_items (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, category) VALUES
('Peito de Frango', 165, 31, 0, 3.6, 0, 'Proteína'),
('Arroz Integral', 111, 2.6, 22, 0.9, 1.8, 'Carboidrato'),
('Batata Doce', 86, 1.6, 20, 0.1, 3, 'Carboidrato'),
('Banana', 89, 1.1, 23, 0.3, 2.6, 'Fruta'),
('Ovos', 155, 13, 1.1, 11, 0, 'Proteína'),
('Aveia', 389, 17, 66, 6.9, 10.6, 'Carboidrato'),
('Amendoim', 567, 25.8, 16, 49, 8.5, 'Gordura'),
('Brócolis', 34, 2.8, 7, 0.4, 2.6, 'Vegetal'),
('Salmão', 208, 25, 0, 12, 0, 'Proteína'),
('Quinoa', 368, 14, 64, 6, 7, 'Carboidrato'),
('Abacate', 160, 2, 9, 15, 7, 'Gordura'),
('Espinafre', 23, 2.9, 3.6, 0.4, 2.2, 'Vegetal'),
('Iogurte Grego', 59, 10, 3.6, 0.4, 0, 'Proteína'),
('Maçã', 52, 0.3, 14, 0.2, 2.4, 'Fruta'),
('Azeite de Oliva', 884, 0, 0, 100, 0, 'Gordura');

-- Insert sample exercises
INSERT INTO public.exercises (name, category, muscle_groups, difficulty, equipment, instructions, tips, sets, reps, rest_time) VALUES
('Supino Reto', 'Força', '{"Peito", "Tríceps", "Ombros"}', 'Intermediário', '{"Barra", "Banco"}', 
 '{"Deite-se no banco com os pés firmes no chão", "Segure a barra com pegada ligeiramente mais larga que os ombros", "Desça a barra até tocar o peito", "Empurre a barra para cima de forma controlada"}', 
 '{"Mantenha os ombros retraídos", "Não deixe a barra quicar no peito", "Expire ao empurrar a barra"}', 
 4, 12, 90),

('Agachamento Livre', 'Força', '{"Quadríceps", "Glúteos", "Posterior"}', 'Intermediário', '{"Barra"}', 
 '{"Posicione a barra nas costas", "Pés na largura dos ombros", "Desça flexionando quadril e joelhos", "Suba mantendo o tronco ereto"}', 
 '{"Mantenha os joelhos alinhados com os pés", "Desça até o quadril ficar abaixo dos joelhos", "Mantenha o core contraído"}', 
 4, 15, 120),

('Flexão de Braço', 'Funcional', '{"Peito", "Tríceps", "Core"}', 'Iniciante', '{"Peso Corporal"}', 
 '{"Posição de prancha com mãos no chão", "Mãos na largura dos ombros", "Desça o corpo mantendo-o reto", "Empurre para cima até esticar os braços"}', 
 '{"Mantenha o core contraído", "Não deixe o quadril cair", "Controle o movimento"}', 
 3, 15, 60),

('Burpee', 'HIIT', '{"Corpo Todo"}', 'Avançado', '{"Peso Corporal"}', 
 '{"Comece em pé", "Agache e coloque as mãos no chão", "Salte para posição de prancha", "Faça uma flexão", "Puxe os pés de volta", "Salte para cima com braços erguidos"}', 
 '{"Mantenha ritmo constante", "Foque na técnica", "Respire adequadamente"}', 
 3, 10, 90),

('Pulldown', 'Força', '{"Costas", "Bíceps"}', 'Intermediário', '{"Cabo", "Pulley"}', 
 '{"Sente-se na máquina", "Segure a barra com pegada pronada", "Puxe a barra até o peito", "Controle a subida"}', 
 '{"Mantenha o tronco ereto", "Contraía as escápulas", "Não use impulso"}', 
 4, 12, 90),

('Prancha', 'Funcional', '{"Core", "Ombros"}', 'Iniciante', '{"Peso Corporal"}', 
 '{"Posição de apoio com antebraços no chão", "Corpo em linha reta", "Mantenha a posição", "Respire normalmente"}', 
 '{"Não deixe o quadril cair", "Mantenha os ombros sobre os cotovelos", "Contraía o abdômen"}', 
 3, 0, 60),

('Leg Press', 'Força', '{"Quadríceps", "Glúteos"}', 'Iniciante', '{"Máquina Leg Press"}', 
 '{"Sente-se na máquina", "Pés na plataforma na largura dos ombros", "Desça controlando o peso", "Empurre a plataforma para cima"}', 
 '{"Não trave os joelhos completamente", "Mantenha os joelhos alinhados", "Controle o movimento"}', 
 4, 15, 90),

('Desenvolvimento de Ombros', 'Força', '{"Ombros", "Tríceps"}', 'Intermediário', '{"Halteres", "Banco"}', 
 '{"Sente-se no banco", "Halteres na altura dos ombros", "Empurre os halteres para cima", "Desça controladamente"}', 
 '{"Mantenha o tronco ereto", "Não arqueie as costas", "Controle o movimento"}', 
 4, 12, 90);

-- Enable realtime for important tables
ALTER TABLE public.exercises REPLICA IDENTITY FULL;
ALTER TABLE public.workout_templates REPLICA IDENTITY FULL;
ALTER TABLE public.student_workouts REPLICA IDENTITY FULL;
ALTER TABLE public.workout_logs REPLICA IDENTITY FULL;
ALTER TABLE public.meal_entries REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;