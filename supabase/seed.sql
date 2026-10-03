-- Starting data for a new database (and the local test database).
-- Categories as they are in the live project.

insert into public.categories (id, slug, name, sort_order) values ('61869c4d-f2ef-42a4-8896-690428a821dc', 'collectible', '{"es": "Collectible"}'::jsonb, 0) on conflict (id) do nothing;
insert into public.categories (id, slug, name, sort_order) values ('b573960b-2f1a-414b-ab13-1bada1765d18', 'utilities', '{"es": "Utilities"}'::jsonb, 0) on conflict (id) do nothing;
