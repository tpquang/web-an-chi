-- Tách nhóm "Nụ, nhang" thành hai nhóm: nụ (CONE) và nhang (STICK)
ALTER TYPE "MaterialGroup" RENAME VALUE 'INCENSE' TO 'CONE';
ALTER TYPE "MaterialGroup" ADD VALUE 'STICK';
