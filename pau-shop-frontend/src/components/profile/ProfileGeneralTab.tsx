import { useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { saveProfile } from "../../features/profile/profileSlice";
import { locale, t } from "../../i18n";

// Same rule the backend enforces on PATCH /users/me. Browsers compile `pattern`
// with the `v` flag, which requires escaping - ( ) inside a character class.
const PHONE_PATTERN = "[0-9+\\-\\(\\) ]{7,20}";

export default function ProfileGeneralTab() {
  const dispatch = useAppDispatch();
  const { profile, loading, saving, error } = useAppSelector(
    (state) => state.profile
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (loading && !profile) {
    return <p>{t.profile.loading}</p>;
  }

  if (!profile) {
    return <p className="text-red-400">{t.profile.loadError}</p>;
  }

  const startEditing = () => {
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(
        saveProfile({ name: name.trim(), phone: phone.trim() })
      ).unwrap();
      toast.success(t.profile.saved);
      setEditing(false);
    } catch {
      // error is shown from state
    }
  };

  const memberSince = new Date(profile.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
      {!profile.phone && !editing && (
        <p className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-200 p-4 text-sm">
          {t.profile.phoneMissing}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-white/60 mb-1">{t.profile.name}</p>
            {editing ? (
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-800 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            ) : (
              <p>{profile.name}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-white/60 mb-1">{t.profile.phone}</p>
            {editing ? (
              <input
                type="tel"
                className="w-full p-2 rounded bg-gray-800 text-white"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern={PHONE_PATTERN}
                required
              />
            ) : (
              <p className={profile.phone ? "" : "text-white/50"}>
                {profile.phone ?? t.profile.noPhone}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-white/60 mb-1">{t.profile.email}</p>
            <p>{profile.email}</p>
          </div>

          <div>
            <p className="text-sm text-white/60 mb-1">{t.profile.memberSince}</p>
            <p>{memberSince}</p>
          </div>
        </div>

        {editing && error && <p className="text-red-400 mt-6">{t.profile.saveError}</p>}

        <div className="flex justify-end gap-3 mt-8">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition cursor-pointer"
                disabled={saving}
              >
                {t.profile.cancel}
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 transition px-6 py-2 rounded-xl cursor-pointer disabled:opacity-60"
                disabled={saving}
              >
                {saving ? t.profile.saving : t.profile.save}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="bg-purple-600 hover:bg-purple-700 transition px-6 py-2 rounded-xl cursor-pointer"
            >
              {t.profile.edit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
