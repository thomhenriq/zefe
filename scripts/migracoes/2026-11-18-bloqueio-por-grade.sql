-- Bloqueios passam a pertencer a uma grade. Rodar uma vez:
--   docker exec -i zefe-postgres-1 psql -U zefe -d zefe -v ON_ERROR_STOP=1 < scripts/migracoes/2026-11-18-bloqueio-por-grade.sql
-- Regra: bloqueio global vira uma cópia em cada grade existente do dono (1 grade = só ela).
-- Dono sem nenhuma grade: o bloqueio não tem onde ficar; sobra só no backup.
BEGIN;
CREATE TABLE bloqueio_backup_20261118 AS SELECT * FROM bloqueio;
ALTER TABLE bloqueio ADD COLUMN grade_id integer;
-- copias para as grades além da primeira de cada dono
INSERT INTO bloqueio (user_id, nome, dia, inicio, fim, grade_id)
  SELECT b.user_id, b.nome, b.dia, b.inicio, b.fim, g.id
  FROM bloqueio b JOIN grade g ON g.user_id = b.user_id
  WHERE b.grade_id IS NULL AND g.id <> (SELECT min(id) FROM grade WHERE user_id = b.user_id);
-- originais ficam na primeira grade do dono
UPDATE bloqueio b SET grade_id = (SELECT min(id) FROM grade g WHERE g.user_id = b.user_id) WHERE b.grade_id IS NULL;
DELETE FROM bloqueio WHERE grade_id IS NULL;
ALTER TABLE bloqueio ALTER COLUMN grade_id SET NOT NULL;
ALTER TABLE bloqueio ADD CONSTRAINT bloqueio_grade_id_grade_id_fk FOREIGN KEY (grade_id) REFERENCES grade(id) ON DELETE CASCADE;
SELECT user_id, count(*) bloqueios, count(DISTINCT grade_id) grades FROM bloqueio GROUP BY 1;
COMMIT;
