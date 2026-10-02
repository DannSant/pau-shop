import { useState } from "react";
import { signInWithGoogle } from "../../api/auth";
import { rememberNext } from "../../features/auth/authRedirect";
import { t } from "../../i18n";

// Used on both the login and sign-up pages: Google creates the account the
// first time and signs in every time after.
export default function GoogleButton({
  next,
  onError,
}: {
  // Page to return to after signing in (kept across the trip to Google).
  next?: string;
  onError: (message: string) => void;
}) {
  const [redirecting, setRedirecting] = useState(false);

  const handleClick = async () => {
    setRedirecting(true);
    rememberNext(next);
    try {
      await signInWithGoogle(); // the browser leaves the site here
    } catch {
      setRedirecting(false);
      onError(t.login.googleError);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={redirecting}
      className="w-full flex items-center justify-center gap-2 border border-gray-600 text-white p-2 rounded cursor-pointer disabled:opacity-60"
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
      {t.login.googleButton}
    </button>
  );
}
