import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/useAppSelector";
import { SIGN_IN_PAGES, clearRememberedNext } from "../features/auth/authRedirect";

const AUTH_PAGES = ["/login", "/signup"];

// Signed-in users without a phone (e.g. a first Google sign-in) must add one
// before using the rest of the site.
export default function ProfileCompletionGate() {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const signInFinished = user?.hasPhone === true && !SIGN_IN_PAGES.includes(location.pathname);

  // The page remembered for the trip to Google has been reached (or replaced).
  useEffect(() => {
    if (signInFinished) clearRememberedNext();
  }, [signInFinished]);

  if (user?.hasPhone === false && location.pathname !== "/complete-profile") {
    // Afterwards, continue to the page they were heading to. On the login and
    // sign-up pages that's the page that sent them there, not the page itself.
    const from = AUTH_PAGES.includes(location.pathname) ? location.state?.from : location;
    return <Navigate to="/complete-profile" state={from ? { from } : null} replace />;
  }

  return <Outlet />;
}
