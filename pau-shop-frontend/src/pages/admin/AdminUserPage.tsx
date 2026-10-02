import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAsyncData } from "../../hooks/useAsyncData";
import {
  banUserFromReviews,
  deleteAllUserReviews,
  getModerationUser,
  unbanUserFromReviews,
} from "../../api/admin";
import AdminReviewItem from "../../components/admin/AdminReviewItem";
import { StarRating } from "../../components/reviews/StarRating";
import { localize, t } from "../../i18n";
import {
  ADMIN_PILL,
  BAN_BUTTON,
  BANNED_PILL,
  CARD,
  DANGER_BUTTON,
  INPUT,
  LABEL,
  SECONDARY_BUTTON,
} from "../../components/admin/adminStyles";
import { formatLongDate as formatDate } from "../../utils/date";

const MAX_NOTE_LENGTH = 500;

// One customer's reviews, deleted-review history and review ban.
export default function AdminUserPage() {
  const { id = "" } = useParams();
  const load = useCallback(() => getModerationUser(id), [id]);
  const { data, failed, reload } = useAsyncData(load);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const backLink = (
    <Link to="/admin?tab=reviews&view=users" className="text-purple-300 hover:underline">
      ← {t.admin.backToUsers}
    </Link>
  );

  if (failed) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 text-white space-y-4">
        {backLink}
        <p>{t.admin.userNotFound}</p>
      </div>
    );
  }
  if (!data) {
    return <div className="max-w-5xl mx-auto px-6 py-10 text-white/60">{t.admin.loading}</div>;
  }

  const { user, reviews, deleted } = data;
  const isAdmin = user.role === "admin";

  // Runs an action, then reloads the page data.
  const run = async (action: () => Promise<unknown>, done: string, error: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      reload();
      return true;
    } catch {
      toast.error(error);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleBan = async () => {
    if (!window.confirm(t.admin.confirmBan(user.name))) return;
    const ok = await run(
      () => banUserFromReviews(user.id, note.trim() || null),
      t.admin.bannedToast,
      t.admin.banError
    );
    if (ok) setNote("");
  };

  const handleUnban = () => {
    if (!window.confirm(t.admin.confirmUnban(user.name))) return;
    run(() => unbanUserFromReviews(user.id), t.admin.unbannedToast, t.admin.banError);
  };

  const handleDeleteAll = () => {
    if (!window.confirm(t.admin.confirmDeleteAll(reviews.length, user.name))) return;
    run(
      () => deleteAllUserReviews(user.id),
      t.admin.allDeletedToast(reviews.length),
      t.admin.reviewDeleteError
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white space-y-8">
      {backLink}

      {/* Customer */}
      <div className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
              {user.name}
              {isAdmin && <span className={ADMIN_PILL}>{t.admin.adminPill}</span>}
              {user.banned_at && <span className={BANNED_PILL}>{t.admin.bannedPill}</span>}
            </h1>
            <p className="text-white/70 break-all">{user.email}</p>
            <p className="text-sm text-white/60 mt-1">
              {t.admin.phone}: {user.phone || t.admin.noPhone} · {t.admin.memberSince}{" "}
              {formatDate(user.created_at)}
            </p>
          </div>

          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{user.review_count}</p>
              <p className="text-xs text-white/60">{t.admin.reviewsLabel}</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${user.deleted_review_count > 0 ? "text-red-300" : ""}`}>
                {user.deleted_review_count}
              </p>
              <p className="text-xs text-white/60">{t.admin.deletedLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ban */}
      <div className={CARD}>
        <h2 className="text-lg font-semibold mb-3">{t.admin.reviewPermission}</h2>

        {user.banned_at ? (
          <div className="space-y-3">
            <p className="text-red-300">{t.admin.bannedSince(formatDate(user.banned_at), data.banned_by_name)}</p>
            {user.ban_note && (
              <p className="text-sm text-white/70 whitespace-pre-line wrap-break-word">
                <span className="text-white/50">{t.admin.banNoteLabel}: </span>
                {user.ban_note}
              </p>
            )}
            <button type="button" className={SECONDARY_BUTTON} onClick={handleUnban} disabled={busy}>
              {t.admin.unban}
            </button>
          </div>
        ) : isAdmin ? (
          <p className="text-white/60">{t.admin.cannotBanAdmin}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-white/70">{t.admin.canReview}</p>
            <div>
              <label className={LABEL} htmlFor="ban-note">
                {t.admin.banNote}
              </label>
              <textarea
                id="ban-note"
                className={INPUT}
                rows={2}
                maxLength={MAX_NOTE_LENGTH}
                placeholder={t.admin.banNotePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button type="button" className={BAN_BUTTON} onClick={handleBan} disabled={busy}>
              {t.admin.ban}
            </button>
          </div>
        )}
      </div>

      {/* Published reviews */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.admin.currentReviews}</h2>
          {reviews.length > 0 && (
            <button type="button" className={`${DANGER_BUTTON} text-sm`} onClick={handleDeleteAll} disabled={busy}>
              {t.admin.deleteAllReviews(reviews.length)}
            </button>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-white/60">{t.admin.noCurrentReviews}</p>
        ) : (
          reviews.map((review) => (
            <AdminReviewItem key={review.id} review={review} showAuthor={false} onDeleted={reload} />
          ))
        )}
      </section>

      {/* Deleted history */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.admin.deletedHistory}</h2>
        {deleted.length === 0 ? (
          <p className="text-white/60">{t.admin.noDeletedHistory}</p>
        ) : (
          deleted.map((review) => (
            <div key={review.id} className={`${CARD} border border-red-400/20`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating value={review.score} size="sm" />
                <span className="font-semibold">
                  {review.product_name ? localize(review.product_name) : t.admin.productRemoved}
                </span>
                <span className="text-sm text-white/50">{formatDate(review.review_created_at)}</span>
              </div>
              {review.comment && <p className="mt-3 whitespace-pre-line wrap-break-word text-white/80">{review.comment}</p>}
              <p className="mt-3 text-sm text-red-300">
                {t.admin.deletedOn(formatDate(review.deleted_at), review.deleted_by_name)}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
