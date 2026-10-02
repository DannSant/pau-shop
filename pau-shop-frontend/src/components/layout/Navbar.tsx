import { Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import { t } from "../../i18n";
import { ShoppingCart } from "lucide-react";
import LogoutButton from "../auth/LogoutButton";
import LanguageSwitcher from "./LanguageSwitcher";


export default function Navbar() {
  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector((state) => state.cart.items);

  const getItemCount = () => {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return totalCount;
  }


  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-x-3 gap-y-2">
        <Link
          to="/"
          className="text-lg sm:text-xl font-bold text-purple-600 whitespace-nowrap"
        >
          {t.navbar.brand}
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6 text-sm sm:text-base whitespace-nowrap">
          <Link to="/browse" className="hover:text-purple-600">
            {t.navbar.browse}
          </Link>

          <Link
            to="/cart"
            className="relative hover:text-purple-600 flex items-center"
          >
            <ShoppingCart className="w-5 h-5 transition-transform hover:scale-110" />

            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {getItemCount()}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="hover:text-purple-600">
                  {t.navbar.admin}
                </Link>
              )}
              <Link to="/profile" className="hover:text-purple-600">
                {t.navbar.profile}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link to="/login" className="hover:text-purple-600">
              {t.navbar.login}
            </Link>
          )}

          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
