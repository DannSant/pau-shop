import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAsyncData } from "../../hooks/useAsyncData";
import {
  getModerationUsers,
  getRecentReviews,
  type AdminReview,
  type Page,
  type UserReviewSummary,
} from "../../api/admin";
import AdminReviewItem from "./AdminReviewItem";
import { t } from "../../i18n";
import { formatLongDate as formatDate } from "../../utils/date";
import { ADMIN_PILL, BANNED_PILL, CARD, INPUT, SECONDARY_BUTTON } from "./adminStyles";

// Pages loaded with "Cargar más", on top of the first page. `key` ties them to
// the list they continue (e.g. the search they belong to).
interface Extra<T> extends Page<T> {
  key: string;
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="text-center">
      <button type="button" className={SECONDARY_BUTTON} onClick={onClick} disabled={loading}>
        {loading ? t.admin.loading : t.admin.loadMore}
      </button>
    </div>
  );
}

function RecentReviews() {
  const load = useCallback(() => getRecentReviews(0), []);
  const { data, failed } = useAsyncData(load);
  const [extra, setExtra] = useState<Extra<AdminReview> | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);

  if (failed) return <p className="text-red-300">{t.admin.loadError}</p>;
  if (!data) return <p className="text-white/60">{t.admin.loading}</p>;

  const loaded = [...data.items, ...(extra?.items ?? [])];
  const items = loaded.filter((r) => !removed.has(r.id));
  const hasMore = extra ? extra.hasMore : data.hasMore;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      // Deleted reviews no longer count on the server, so skip fewer.
      const next = await getRecentReviews(loaded.length - removed.size);
      const seen = new Set(loaded.map((r) => r.id));
      setExtra({
        key: "",
        items: [...(extra?.items ?? []), ...next.items.filter((r) => !seen.has(r.id))],
        hasMore: next.hasMore,
      });
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  if (items.length === 0 && !hasMore) return <p className="text-white/60">{t.admin.noReviews}</p>;

  return (
    <div className="space-y-4">
      {items.map((review) => (
        <AdminReviewItem
          key={review.id}
          review={review}
          onDeleted={(id) => setRemoved((prev) => new Set(prev).add(id))}
        />
      ))}
      {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
    </div>
  );
}

function UserRow({ user }: { user: UserReviewSummary }) {
  return (
    <Link to={`/admin/users/${user.id}`} className={`${CARD} block hover:bg-white/15 transition`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold flex flex-wrap items-center gap-2">
            {user.name}
            {user.role === "admin" && <span className={ADMIN_PILL}>{t.admin.adminPill}</span>}
            {user.banned_at && <span className={BANNED_PILL}>{t.admin.bannedPill}</span>}
          </p>
          <p className="text-sm text-white/60 break-all">{user.email}</p>
        </div>

        <div className="flex gap-6 text-center">
          <div>
            <p className="text-xl font-bold">{user.review_count}</p>
            <p className="text-xs text-white/60">{t.admin.reviewsLabel}</p>
          </div>
          <div>
            <p className={`text-xl font-bold ${user.deleted_review_count > 0 ? "text-red-300" : ""}`}>
              {user.deleted_review_count}
            </p>
            <p className="text-xs text-white/60">{t.admin.deletedLabel}</p>
          </div>
        </div>
      </div>
      {user.last_deleted_at && (
        <p className="text-xs text-white/50 mt-2">{t.admin.lastDeleted(formatDate(user.last_deleted_at))}</p>
      )}
    </Link>
  );
}

function UsersList() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const load = useCallback(() => getModerationUsers(search, 0), [search]);
  const { data, loading, failed } = useAsyncData(load);
  const [extra, setExtra] = useState<Extra<UserReviewSummary> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search once the admin stops typing for a moment.
  const handleInput = (value: string) => {
    setInput(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSearch(value.trim()), 300);
  };

  const current = extra?.key === search ? extra : null;
  const items = data ? [...data.items, ...(current?.items ?? [])] : [];
  const hasMore = current ? current.hasMore : !!data?.hasMore;

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await getModerationUsers(search, items.length);
      const seen = new Set(items.map((u) => u.id));
      setExtra({
        key: search,
        items: [...(current?.items ?? []), ...next.items.filter((u) => !seen.has(u.id))],
        hasMore: next.hasMore,
      });
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="search"
        className={INPUT}
        placeholder={t.admin.searchUsers}
        aria-label={t.admin.searchUsers}
        value={input}
        onChange={(e) => handleInput(e.target.value)}
      />

      {failed ? (
        <p className="text-red-300">{t.admin.loadError}</p>
      ) : !data ? (
        <p className="text-white/60">{t.admin.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-white/60">{t.admin.noUsers}</p>
      ) : (
        <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
          {hasMore && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsTab() {
  // The view lives in the URL so "back" from a user returns to the users list.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "users" ? "users" : "reviews";

  const views = [
    { id: "reviews", label: t.admin.recentReviews },
    { id: "users", label: t.admin.users },
  ] as const;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSearchParams(v.id === "users" ? { tab: "reviews", view: "users" } : { tab: "reviews" })}
            className={`px-4 py-1.5 rounded-full text-sm transition cursor-pointer ${
              view === v.id ? "bg-purple-600 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "reviews" ? <RecentReviews /> : <UsersList />}
    </div>
  );
}
