import { useSelector } from "react-redux";
import { Navigate, Outlet , useLocation } from "react-router-dom";
import type { RootState } from "../../src/app/store";

export default function ProtectedRoute() {

  const location = useLocation();

  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  if (loading) return null;

 if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

  return <Outlet />;
}