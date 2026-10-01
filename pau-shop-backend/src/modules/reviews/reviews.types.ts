export interface ReviewInput {
  score: number;
  comment: string | null;
}

export const MAX_COMMENT_LENGTH = 1000;

// A review as shown publicly: the author's name is shortened and the user id
// is never included.
export interface PublicReview {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  author: string | null;
}

export interface ReviewStats {
  average: number | null;
  count: number;
}
