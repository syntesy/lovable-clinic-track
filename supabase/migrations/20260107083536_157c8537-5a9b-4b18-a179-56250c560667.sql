-- Inserir 12 novos itens de ortobiológicos/biológicos
-- Total esperado após inserção: 47 itens (35 existentes + 12 novos)

-- 1. Adiposo autólogo (autologous_biologic)
INSERT INTO public.therapy_items (code, name, category_code)
VALUES ('AUTO_MICROFAT', 'Microfat (aspirado adiposo processado)', 'autologous_biologic');

-- 2. Derivados de tecido / matriz (bio_stimulator)
INSERT INTO public.therapy_items (code, name, category_code)
VALUES 
  ('BIO_ECM', 'Matriz extracelular biológica (descelularizada)', 'bio_stimulator'),
  ('BIO_AMNION', 'Membrana amniótica processada', 'bio_stimulator'),
  ('BIO_PLACENTA', 'Derivados de placenta processados', 'bio_stimulator');

-- 3. Variações de PRP (autologous_biologic)
INSERT INTO public.therapy_items (code, name, category_code)
VALUES 
  ('AUTO_LP_PRP', 'PRP pobre em leucócitos (LP-PRP)', 'autologous_biologic'),
  ('AUTO_LR_PRP', 'PRP rico em leucócitos (LR-PRP)', 'autologous_biologic');

-- 4. Variações de PRF (autologous_biologic)
INSERT INTO public.therapy_items (code, name, category_code)
VALUES 
  ('AUTO_IPRF', 'i-PRF (fibrina injetável)', 'autologous_biologic'),
  ('AUTO_APRF', 'A-PRF (Advanced PRF)', 'autologous_biologic'),
  ('AUTO_LPRF', 'L-PRF (Leukocyte PRF)', 'autologous_biologic');

-- 5. Combinações (bio_stimulator)
INSERT INTO public.therapy_items (code, name, category_code)
VALUES 
  ('HYB_PRP_HA', 'PRP + Ácido Hialurônico (combinação)', 'bio_stimulator'),
  ('HYB_PRP_PN', 'PRP + Polinucleotídeos (combinação)', 'bio_stimulator'),
  ('HYB_PRP_COL', 'PRP + Colágeno (combinação)', 'bio_stimulator');