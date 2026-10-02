import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../lib/supabase";
import { logout, setProfileStatus, setUser } from "../features/auth/authSlice";
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

      dispatch(setUser({ id: user.id, email: user.email ?? "" }));

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        // The backend still enforces the role; this only drives the UI.
        // If the profile can't be loaded, don't block the user on the phone step.
        ensureUserProfile(user).then((profile) => {
          dispatch(
            setProfileStatus({
              userId: user.id,
              role: profile?.role ?? "user",
              hasPhone: profile ? !!profile.phone : true,
            })
          );
        });
      }
    });

    return () => data.subscription.unsubscribe();
  }, [dispatch]);
}
