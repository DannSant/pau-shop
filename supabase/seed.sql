-- Starting data for a new database (and the local test database).
-- Categories as they are in the live project.

insert into public.categories (id, slug, name, sort_order) values ('61869c4d-f2ef-42a4-8896-690428a821dc', 'collectible', '{"es": "Collectible"}'::jsonb, 0) on conflict (id) do nothing;
insert into public.categories (id, slug, name, sort_order) values ('b573960b-2f1a-414b-ab13-1bada1765d18', 'utilities', '{"es": "Utilities"}'::jsonb, 0) on conflict (id) do nothing;

-- A few postal codes so the local database works without the full SEPOMEX
-- import (scripts/import-sepomex.mjs loads the real catalog).
insert into public.postal_codes (postal_code, neighborhood, neighborhood_type, municipality, city, state) values
  ('01000', 'San Ángel', 'Colonia', 'Álvaro Obregón', 'Ciudad de México', 'Ciudad de México'),
  ('03100', 'Del Valle Centro', 'Colonia', 'Benito Juárez', 'Ciudad de México', 'Ciudad de México'),
  ('03100', 'Insurgentes San Borja', 'Colonia', 'Benito Juárez', 'Ciudad de México', 'Ciudad de México'),
  ('06600', 'Juárez', 'Colonia', 'Cuauhtémoc', 'Ciudad de México', 'Ciudad de México'),
  ('44100', 'Guadalajara Centro', 'Colonia', 'Guadalajara', 'Guadalajara', 'Jalisco');
