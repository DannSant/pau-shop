-- Security fix: the website's public (publishable) key could write to some
-- tables directly, skipping every check the backend does. For example a
-- signed-in customer could:
--   * set their own user_data.role to 'admin'
--   * change product prices
--   * add product images
--   * post a review without having received the product
--
-- The website never writes to the database itself; every change goes through
-- the backend, which uses the service role key. So the public roles (anon =
-- signed out, authenticated = signed in) lose all write access. Reading is
-- unchanged and still limited by RLS.

begin;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public
  from anon, authenticated;

-- Tables created later start without write access for them either.
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger
  on tables from anon, authenticated;

commit;
