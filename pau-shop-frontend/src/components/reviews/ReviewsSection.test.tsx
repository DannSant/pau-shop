import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { http } from "msw";
import { API, fail, ok, server } from "../../test/server";
import { renderPage, signedIn } from "../../test/render";
import ReviewsSection from "./ReviewsSection";

const summary = {
  average: 4.5,
  count: 2,
  reviews: [
    { id: "r1", score: 5, comment: "Excelente", created_at: "2026-09-01T00:00:00Z", updated_at: null, author: "Daniel L." },
    { id: "r2", score: 4, comment: null, created_at: "2026-09-02T00:00:00Z", updated_at: "2026-09-03T00:00:00Z", author: "Ana" }
  ]
};

function api(me: object | null) {
  server.use(
    http.get(`${API}/products/p1/reviews`, () => ok(summary)),
    http.get(`${API}/products/p1/reviews/me`, () => (me ? ok(me) : fail(401, "Missing token")))
  );
}

const renderSection = (state?: object) =>
  renderPage(<ReviewsSection productId="p1" onReviewsChanged={vi.fn()} />, { state });

describe("ReviewsSection", () => {
  it("shows the average and the list; signed-out visitors are asked to log in", async () => {
    api(null);
    renderSection();

    expect(await screen.findByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("de 5 · 2 reseñas")).toBeInTheDocument();
    expect(screen.getByText("Daniel L.")).toBeInTheDocument();
    expect(screen.getByText(/\(editada\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicia sesión" })).toBeInTheDocument();
  });

  it("customers who haven't received the product can't write one", async () => {
    api({ canReview: false, banned: false, review: null });
    renderSection(signedIn());
    expect(await screen.findByText("Podrás dejar una reseña cuando recibas este producto.")).toBeInTheDocument();
  });

  it("banned customers see a message instead of the form", async () => {
    api({ canReview: true, banned: true, review: null });
    renderSection(signedIn());
    expect(await screen.findByText("Tu cuenta ya no puede publicar reseñas.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar reseña" })).not.toBeInTheDocument();
  });

  it("asks for a star rating before posting, then posts", async () => {
    api({ canReview: true, banned: false, review: null });
    let posted: unknown;
    server.use(
      http.put(`${API}/products/p1/reviews`, async ({ request }) => {
        posted = await request.json();
        return ok({ id: "new" }, 201);
      })
    );
    const { user } = renderSection(signedIn());

    await user.click(await screen.findByRole("button", { name: "Publicar reseña" }));
    expect(screen.getByText("Elige una calificación de 1 a 5 estrellas.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "4 estrellas" }));
    expect(screen.queryByText("Elige una calificación de 1 a 5 estrellas.")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Comentario (opcional)"), "  Muy buena  ");
    await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

    expect(await screen.findByText("¡Gracias por tu reseña!")).toBeInTheDocument();
    expect(posted).toEqual({ score: 4, comment: "Muy buena" });
  });
});
