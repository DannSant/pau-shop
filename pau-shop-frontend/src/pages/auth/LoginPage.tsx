import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { loginUser } from "../../features/auth/authSlice";
import { t } from "../../i18n";

// Redirect after login is handled by GuestRoute.
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(
      loginUser({
        email,
        password,
      })
    );
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-black/60 p-8 rounded-xl"
      >
        <h1 className="text-2xl text-white mb-6">{t.login.title}</h1>

        <div className="mb-4">
          <label className="block text-white mb-2">{t.login.email}</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-white mb-2">{t.login.password}</label>
          <input
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-red-400 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded cursor-pointer"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link
          to="/signup"
          className="block text-center text-blue-400 mt-4"
        >
          {t.login.noAccount}
        </Link>
      </form>
    </div>
  );
}