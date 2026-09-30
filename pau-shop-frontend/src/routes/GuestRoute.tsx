import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { RootState } from "../app/store";

export default function GuestRoute() {
  const location = useLocation();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const cartEmpty = useSelector(
    (state: RootState) => state.cart.items.length === 0
  );

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || (cartEmpty ? "/" : "/cart");
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
