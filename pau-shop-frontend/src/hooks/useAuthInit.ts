import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../lib/supabase";
import { logout, setUser } from "../features/auth/authSlice";
import { ensureUserProfile } from "../features/auth/ensureUserProfile";

export default function useAuthInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fires INITIAL_SESSION on subscribe, then on every auth change,
    // including ones made in other tabs (e.g. the email confirmation link).
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
          dispatch(logout());
        }
        return;
      }

      const user = session.user;

      localStorage.setItem("token", session.access_token);

      dispatch(
        setUser({
          id: user.id,
          email: user.email ?? "",
          role: user.role ?? "user",
        })
      );

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        ensureUserProfile(user);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [dispatch]);
}
