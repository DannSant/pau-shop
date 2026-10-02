import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getMe } from "../../api/users";
import { saveProfile } from "../../features/profile/profileSlice";
import { authDestination } from "../../features/auth/authRedirect";
import { setProfileStatus } from "../../features/auth/authSlice";
import { rememberProfile } from "../../features/auth/ensureUserProfile";
import type { UserProfile } from "../../types/user";
import { PHONE_PATTERN } from "../../utils/phone";
import { t } from "../../i18n";

function CompleteProfileForm({ profile }: { profile: UserProfile }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saving sets auth.user.hasPhone, and the page then redirects on its own.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await dispatch(saveProfile({ name: name.trim(), phone: phone.trim() })).unwrap();
    } catch {
      setError(t.completeProfile.error);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-black/60 p-8 rounded-xl">
      <h1 className="text-2xl text-white mb-2">{t.completeProfile.title}</h1>
      <p className="text-gray-300 mb-6">{t.completeProfile.intro}</p>

      <div className="mb-4">
        <label className="block text-white mb-2" htmlFor="complete-name">
          {t.completeProfile.name}
        </label>
        <input
          id="complete-name"
          type="text"
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-white mb-2" htmlFor="complete-phone">
          {t.completeProfile.phone}
        </label>
        <input
          id="complete-phone"
          type="tel"
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          pattern={PHONE_PATTERN}
          required
          autoFocus
        />
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded cursor-pointer disabled:opacity-60"
        disabled={saving}
      >
        {saving ? t.completeProfile.saving : t.completeProfile.save}
      </button>
    </form>
  );
}

export default function CompleteProfilePage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const cartEmpty = useAppSelector((state) => state.cart.items.length === 0);

  // Fresh copy, in case the phone was added meanwhile (e.g. in another tab).
  const userId = user?.id;
  const load = useCallback(() => (userId ? getMe() : Promise.resolve(null)), [userId]);
  const { data: profile, failed } = useAsyncData(load);

  // Phone already added (e.g. in another tab): update the state, which ends the gate.
  useEffect(() => {
    if (profile?.phone && user?.hasPhone === false) {
      rememberProfile(profile);
      dispatch(setProfileStatus({ userId: profile.id, role: profile.role, hasPhone: true }));
    }
  }, [profile, user?.hasPhone, dispatch]);

  if (user?.hasPhone === true) {
    const from = location.state?.from?.pathname;
    return <Navigate to={authDestination(from, cartEmpty)} replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      {failed ? (
        <p className="text-red-400">{t.completeProfile.error}</p>
      ) : !profile ? (
        <p className="text-white">{t.completeProfile.loading}</p>
      ) : (
        <CompleteProfileForm profile={profile} />
      )}
    </div>
  );
}
