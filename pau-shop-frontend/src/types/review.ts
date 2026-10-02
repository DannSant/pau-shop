import type { ReviewStats } from "./product";

// A review as shown publicly (no user id; author is e.g. "Daniel S.").
export interface Review {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  author: string | null;
}

export interface ProductReviews extends ReviewStats {
  reviews: Review[];
}

export interface MyReviewStatus {
  canReview: boolean;
  // Blocked by an admin: can no longer write or edit reviews.
  banned: boolean;
  review: Omit<Review, "author"> | null;
}
