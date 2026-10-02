import { LocalizedText } from "../../utils/localized";

export const PAGE_SIZE = 50;
export const MAX_BAN_NOTE_LENGTH = 500;

export interface Page<T> {
  items: T[];
  hasMore: boolean;
}

// A review as the admin sees it: with the product and the author's contact.
export interface AdminReview {
  id: string;
  product_id: string | null;
  user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  product_name: LocalizedText | null;
  user_name: string | null;
  user_email: string | null;
  user_banned: boolean;
}

export interface UserReviewSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  review_count: number;
  deleted_review_count: number;
  last_deleted_at: string | null;
  banned_at: string | null;
  ban_note: string | null;
}

export interface DeletedReview {
  id: string;
  product_id: string | null;
  product_name: LocalizedText | null;
  score: number;
  comment: string | null;
  review_created_at: string;
  deleted_at: string;
  deleted_by_name: string | null;
}

export interface UserModerationDetail {
  user: UserReviewSummary;
  banned_by_name: string | null;
  reviews: AdminReview[];
  deleted: DeletedReview[];
}
