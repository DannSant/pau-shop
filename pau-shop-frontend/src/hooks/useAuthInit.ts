import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../lib/supabase";
import { setUser } from "../features/auth/authSlice";

export default function useAuthInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        const user = data.session.user;

        dispatch(
          setUser({
            id: user.id,
            email: user.email ?? "",
            role: user.role ?? "user",
          })
        );

        localStorage.setItem("token", data.session.access_token);
      }
    };

    initAuth();
  }, [dispatch]);
}