import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { clearAuthError, loginUser } from "../../features/auth/authSlice";
import { t } from "../../i18n";
import GoogleButton from "../../components/auth/GoogleButton";

// When Google sign-in fails or is cancelled, Supabase returns to /login with
// the error in the query string or the hash.
function readGoogleError(): string | null {
  const params = new URLSearchParams(
    window.location.search || window.location.hash.replace(/^#/, "")
  );
  const error = params.get("error");
  if (!error) return null;
  return error === "access_denied" ? t.login.googleCancelled : t.login.googleError;
}

// Redirect after login is handled by GuestRoute.
export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [googleError, setGoogleError] = useState<string | null>(readGoogleError);

  const { loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

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

        {(googleError || error) && (
          <p className="text-red-400 mb-4">
            {googleError ?? (error && (t.authErrors[error] ?? t.login.failed))}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded cursor-pointer"
          disabled={loading}
        >
          {loading ? t.login.submitting : t.login.submit}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-400 text-sm">{t.login.orDivider}</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <GoogleButton next={location.state?.from?.pathname} onError={setGoogleError} />

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