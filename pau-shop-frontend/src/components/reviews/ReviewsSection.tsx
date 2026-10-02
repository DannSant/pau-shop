import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAsyncData } from "../../hooks/useAsyncData";
import { deleteReview, getMyReview, getProductReviews, saveReview } from "../../api/reviews";
import type { MyReviewStatus } from "../../types/review";
import { StarRating, StarRatingInput } from "./StarRating";
import { locale, t } from "../../i18n";

const MAX_COMMENT_LENGTH = 1000;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

function ReviewForm({
  initial,
  onSaved,
  onCancel,
  productId,
}: {
  initial: MyReviewStatus["review"];
  onSaved: () => void;
  onCancel?: () => void;
  productId: string;
}) {
  const [score, setScore] = useState(initial?.score ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1) {
      setError(t.reviews.scoreRequired);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await saveReview(productId, { score, comment: comment.trim() || null });
      toast.success(initial ? t.reviews.updated : t.reviews.saved);
      onSaved();
    } catch {
      setError(t.reviews.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-semibold">{initial ? t.reviews.yourReview : t.reviews.writeTitle}</h3>

      <div>
        <p className="text-sm text-gray-500 mb-1">{t.reviews.score}</p>
        <StarRatingInput
          value={score}
          onChange={(value) => {
            setScore(value);
            setError(null);
          }}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-1" htmlFor="review-comment">
          {t.reviews.comment}
        </label>
        <textarea
          id="review-comment"
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-purple-600"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={t.reviews.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="text-xs text-gray-400 text-right">
          {t.reviews.characters(comment.length, MAX_COMMENT_LENGTH)}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl cursor-pointer disabled:opacity-60"
        >
          {saving ? t.reviews.saving : initial ? t.reviews.update : t.reviews.submit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-xl cursor-pointer"
          >
            {t.reviews.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

export default function ReviewsSection({
  productId,
  onReviewsChanged,
}: {
  productId: string;
  onReviewsChanged: () => void;
}) {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(() => getProductReviews(productId), [productId]);
  const loadMine = useCallback(
    () => (userId ? getMyReview(productId) : Promise.resolve(null)),
    [productId, userId]
  );
  const { data: summary, failed, reload: reloadReviews } = useAsyncData(loadReviews);
  const { data: mine, reload: reloadMine } = useAsyncData(loadMine);

  const refresh = () => {
    setEditing(false);
    reloadReviews();
    reloadMine();
    onReviewsChanged();
  };

  const handleDelete = async () => {
    if (!window.confirm(t.reviews.confirmDelete)) return;
    setDeleting(true);
    try {
      await deleteReview(productId);
      toast.success(t.reviews.deleted);
      refresh();
    } catch {
      toast.error(t.reviews.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const ownReview = mine?.review ?? null;

  return (
    <section id="reviews" className="mt-12 bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">{t.reviews.title}</h2>

      {failed ? (
        <p className="text-red-500">{t.reviews.loadError}</p>
      ) : !summary ? null : (
        <div className="space-y-8">
          {/* Summary */}
          {summary.count > 0 && summary.average !== null ? (
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold">{summary.average.toFixed(1)}</span>
              <div>
                <StarRating value={summary.average} size="lg" />
                <p className="text-sm text-gray-500">
                  {t.reviews.outOfFive} · {t.reviews.count(summary.count)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">{t.reviews.noReviewsYet}</p>
          )}

          {/* Write / edit */}
          {!user ? (
            <p className="text-gray-600">
              <Link to="/login" state={{ from: location }} className="text-purple-600 font-medium hover:underline">
                {t.reviews.loginLink}
              </Link>{" "}
              {t.reviews.loginToReview}
            </p>
          ) : !mine ? null : ownReview && !editing ? (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h3 className="font-semibold">{t.reviews.yourReview}</h3>
                <div className="flex gap-2">
                  {mine.canReview && !mine.banned && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-lg text-sm cursor-pointer"
                    >
                      {t.reviews.edit}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="border border-red-300 text-red-600 bg-white hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm cursor-pointer disabled:opacity-60"
                  >
                    {t.reviews.delete}
                  </button>
                </div>
              </div>
              <StarRating value={ownReview.score} size="sm" />
              {ownReview.comment && <p className="mt-2 text-gray-700 whitespace-pre-line">{ownReview.comment}</p>}
            </div>
          ) : mine.banned ? (
            <p className="text-gray-500">{t.reviews.banned}</p>
          ) : mine.canReview ? (
            <ReviewForm
              key={ownReview?.id ?? "new"}
              productId={productId}
              initial={ownReview}
              onSaved={refresh}
              onCancel={ownReview ? () => setEditing(false) : undefined}
            />
          ) : (
            <p className="text-gray-500">{t.reviews.onlyBuyers}</p>
          )}

          {/* List */}
          {summary.reviews.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {summary.reviews.map((review) => (
                <li key={review.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{review.author ?? t.reviews.anonymous}</span>
                    <StarRating value={review.score} size="sm" />
                    <span className="text-sm text-gray-400">
                      {formatDate(review.created_at)}
                      {review.updated_at ? ` ${t.reviews.edited}` : ""}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-gray-700 whitespace-pre-line">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
