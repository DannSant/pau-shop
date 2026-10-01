import { api } from "./axios";
import { request } from "./request";
import type { MyReviewStatus, ProductReviews, Review } from "../types/review";

export const getProductReviews = (productId: string) =>
  request<ProductReviews>(api.get(`/products/${productId}/reviews`));

// Signed in only: whether the user may review the product, and their review.
export const getMyReview = (productId: string) =>
  request<MyReviewStatus>(api.get(`/products/${productId}/reviews/me`));

// Creates the review or replaces the user's existing one.
export const saveReview = (productId: string, payload: { score: number; comment: string | null }) =>
  request<Review>(api.put(`/products/${productId}/reviews`, payload));

export const deleteReview = (productId: string) =>
  request<unknown>(api.delete(`/products/${productId}/reviews`));
