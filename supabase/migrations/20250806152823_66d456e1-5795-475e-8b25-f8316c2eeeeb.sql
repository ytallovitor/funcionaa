-- Adicionar coluna birth_date à tabela students
ALTER TABLE students ADD COLUMN birth_date DATE;

-- Remover a coluna age (opcional, pode manter por compatibilidade)
-- ALTER TABLE students DROP COLUMN age;

-- Atualizar o portal do aluno para usar username ao invés de nome
-- (Não precisamos alterar a estrutura, apenas a lógica)