import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { clearAuthError, signUpUser } from "../../features/auth/authSlice";
import { t } from "../../i18n";
import GoogleButton from "../../components/auth/GoogleButton";

// Redirect after an immediate-session sign-up is handled by GuestRoute.
export default function SignupPage() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const { loading, error, confirmationRequired } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

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
          <label htmlFor="signup-name" className="block text-white mb-2">{t.signup.name}</label>
          <input
            id="signup-name"
            type="text"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="signup-phone" className="block text-white mb-2">{t.signup.phone}</label>
          <input
            id="signup-phone"
            type="tel"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="signup-email" className="block text-white mb-2">{t.signup.email}</label>
          <input
            id="signup-email"
            type="email"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="signup-password" className="block text-white mb-2">{t.signup.password}</label>
          <input
            id="signup-password"
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="signup-confirm-password" className="block text-white mb-2">
            {t.signup.confirmPassword}
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            className="w-full p-2 rounded bg-gray-800 text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {(localError || error) && (
          <p className="text-red-400 mb-4">
            {localError ?? (error && (t.authErrors[error] ?? t.signup.failed))}
          </p>
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

        <GoogleButton next={location.state?.from?.pathname} onError={setLocalError} />

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
