import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteReviewAsAdmin, type AdminReview } from "../../api/admin";
import { StarRating } from "../reviews/StarRating";
import { localize, t } from "../../i18n";
import { formatLongDate as formatDate } from "../../utils/date";
import { BANNED_PILL, CARD, DANGER_BUTTON } from "./adminStyles";

// One review with its product, author and a delete button. The author line is
// hidden on the user's own page.
export default function AdminReviewItem({
  review,
  showAuthor = true,
  onDeleted,
}: {
  review: AdminReview;
  showAuthor?: boolean;
  onDeleted: (reviewId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const author = review.user_name ?? t.reviews.anonymous;

  const handleDelete = async () => {
    if (!window.confirm(t.admin.confirmDeleteReview(author))) return;
    setDeleting(true);
    try {
      await deleteReviewAsAdmin(review.id);
      toast.success(t.admin.reviewDeleted);
      onDeleted(review.id);
    } catch {
      toast.error(t.admin.reviewDeleteError);
      setDeleting(false);
    }
  };

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StarRating value={review.score} size="sm" />
            {review.product_id && review.product_name ? (
              <Link to={`/products/${review.product_id}`} className="font-semibold hover:text-purple-300">
                {localize(review.product_name)}
              </Link>
            ) : (
              <span className="font-semibold text-white/60">{t.admin.productRemoved}</span>
            )}
          </div>
          <p className="text-sm text-white/60 mt-1">
            {formatDate(review.created_at)}
            {review.updated_at ? ` · ${t.admin.edited} ${formatDate(review.updated_at)}` : ""}
          </p>
        </div>

        <button type="button" className={`${DANGER_BUTTON} text-sm`} onClick={handleDelete} disabled={deleting}>
          {t.admin.deleteReview}
        </button>
      </div>

      {review.comment && <p className="mt-3 whitespace-pre-line wrap-break-word">{review.comment}</p>}

      {showAuthor && (
        <p className="mt-3 text-sm text-white/60 flex flex-wrap items-center gap-2">
          <Link to={`/admin/users/${review.user_id}`} className="text-white hover:text-purple-300 font-medium">
            {author}
          </Link>
          {review.user_email && <span>{review.user_email}</span>}
          {review.user_banned && <span className={BANNED_PILL}>{t.admin.bannedPill}</span>}
        </p>
      )}
    </div>
  );
}
