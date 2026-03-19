import { Link } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import { t } from "../../i18n";
import { ShoppingCart } from "lucide-react";
import LogoutButton from "../auth/LogoutButton";


export default function Navbar() {
  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector((state) => state.cart.items);

  const getItemCount = () => {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return totalCount;
  }


  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-purple-600"
        >
          PauShop
        </Link>

        <div className="flex items-center gap-6">
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

        </div>
      </div>
    </nav>
  );
}
