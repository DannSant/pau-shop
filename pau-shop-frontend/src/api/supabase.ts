// The app must use a single Supabase client: two clients would both try to
// read the Google sign-in result from the URL, and only one can use it.
export { supabase } from "../lib/supabase";
