-- Add additional time fields for each light type (Tempo 2 and Tempo 3)
ALTER TABLE public.reference_protocols 
ADD COLUMN tempo_luz_1_b integer NULL,
ADD COLUMN tempo_luz_1_c integer NULL,
ADD COLUMN tempo_luz_2_b integer NULL,
ADD COLUMN tempo_luz_2_c integer NULL,
ADD COLUMN tempo_luz_3_b integer NULL,
ADD COLUMN tempo_luz_3_c integer NULL,
ADD COLUMN tempo_luz_4_b integer NULL,
ADD COLUMN tempo_luz_4_c integer NULL;