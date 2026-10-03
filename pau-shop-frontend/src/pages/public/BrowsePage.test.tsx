import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "../../test/render";
import BrowsePage from "./BrowsePage";

const product = (id: string, name: string, description: string | null, category?: string) => ({
  id,
  name: { es: name },
  description: description ? { es: description } : null,
  price: 100,
  offer_price: null,
  stock: 5,
  franchise: "Fallout",
  category: category ? { id: category, slug: category, name: { es: category }, sort_order: 0 } : null,
  product_images: [],
  rating: { average: null, count: 0 }
});

const state = {
  products: {
    items: [
      product("1", "Póster Película", "Edición limitada", "posters"),
      product("2", "Taza Nuka", "Taza de cerámica"),
      product("3", "Llavero", null)
    ],
    loading: false,
    error: null
  }
};

const renderBrowse = (route = "/browse") => renderPage(<BrowsePage />, { route, state: state as never });

describe("BrowsePage", () => {
  it("filters as you type by name or description, ignoring case and accents", async () => {
    const { user } = renderBrowse();
    const search = screen.getByPlaceholderText("Buscar por nombre o descripción");

    await user.type(search, "pelicula");
    expect(screen.getByText("Póster Película")).toBeInTheDocument();
    expect(screen.queryByText("Taza Nuka")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "CERAMICA");
    expect(screen.getByText("Taza Nuka")).toBeInTheDocument();
    expect(screen.queryByText("Llavero")).not.toBeInTheDocument();
  });

  it("says when nothing matches, and the clear button shows everything again", async () => {
    const { user } = renderBrowse();
    await user.type(screen.getByPlaceholderText("Buscar por nombre o descripción"), "zzz");
    expect(screen.getByText('No hay productos que coincidan con "zzz".')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Borrar búsqueda" }));
    expect(screen.getByText("Llavero")).toBeInTheDocument();
  });

  it("combines the search with the category filter from the URL", () => {
    renderBrowse("/browse?category=posters&q=taza");
    expect(screen.getByText('No hay productos que coincidan con "taza".')).toBeInTheDocument();
  });
});
