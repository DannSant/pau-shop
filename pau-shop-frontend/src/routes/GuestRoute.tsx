import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { RootState } from "../app/store";
import { authDestination } from "../features/auth/authRedirect";

// Login and sign-up pages: signed-in users are sent on to where they were
// going (or to /complete-profile first if they still have no phone).
export default function GuestRoute() {
  const location = useLocation();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const cartEmpty = useSelector(
    (state: RootState) => state.cart.items.length === 0
  );

  if (isAuthenticated) {
    // Wait for the session and profile, so users without a phone go to the
    // phone step first instead of their destination.
    if (!user || user.hasPhone === null) return null;

    if (!user.hasPhone) {
      return <Navigate to="/complete-profile" state={location.state} replace />;
    }

    const from = location.state?.from?.pathname;
    return <Navigate to={authDestination(from, cartEmpty)} replace />;
  }

  return <Outlet />;
}
