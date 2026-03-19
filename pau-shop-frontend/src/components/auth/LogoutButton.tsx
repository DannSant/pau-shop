import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import { logoutUser } from "../../features/auth/authSlice";
import { t } from "../../i18n";
export default function LogoutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors"
    >
      {t.login.logout}
    </button>
  );
}