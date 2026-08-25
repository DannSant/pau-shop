import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { signUpUser } from "../../features/auth/authSlice";
import { t } from "../../i18n";

export default function SignupPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated, confirmationRequired } =
    useSelector((state: RootState) => state.auth);
  const cartEmpty = useSelector(
    (state: RootState) => state.cart.items.length === 0
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setLocalError(t.signup.passwordMismatch);
      return;
    }

    setLocalError(null);

    dispatch(signUpUser({ email, password, name, phone }));
  };

  const handleGoogleSignUp = () => {
    // Google sign-up logic will be implemented later.
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(cartEmpty ? "/" : "/cart", { replace: true });
    }
  }, [isAuthenticated, navigate, cartEmpty]);

  if (confirmationRequired) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-full max-w-md bg-black/60 p-8 rounded-xl text-center">
          <h1 className="text-2xl text-white mb-4">
            {t.signup.checkEmailTitle}
          </h1>
          <p className="text-gray-300 mb-6">{t.signup.checkEmailBody}</p>
          <Link to="/login" className="text-blue-400">
            {t.signup.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-black/60 p-8 rounded-xl"
      >
        <h1 className="text-2xl text-white mb-6">{t.signup.title}</h1>

        <div className="mb-4">
          <label className="block text-white mb-2">{t.signup.name}</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">{t.signup.phone}</label>
          <input
            type="tel"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">{t.signup.email}</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">{t.signup.password}</label>
          <input
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-white mb-2">
            {t.signup.confirmPassword}
          </label>
          <input
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {(localError || error) && (
          <p className="text-red-400 mb-4">{localError || error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded cursor-pointer"
          disabled={loading}
        >
          {loading ? t.signup.submitting : t.signup.submit}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-400 text-sm">{t.signup.orDivider}</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-2 border border-gray-600 text-white p-2 rounded cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.34z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          {t.signup.googleButton}
        </button>

        <Link
          to="/login"
          className="block text-center text-blue-400 mt-6"
        >
          {t.signup.haveAccount}
        </Link>
      </form>
    </div>
  );
}
