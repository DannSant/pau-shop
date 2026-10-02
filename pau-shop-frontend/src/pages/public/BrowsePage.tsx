import { useMemo } from "react";
import ProductCard from "../../components/product/ProductCard";
import { useSearchParams } from "react-router-dom";
import { localize, t } from "../../i18n";
import type { Category } from "../../types/product";
import { useAppSelector } from "../../hooks/useAppSelector";

// Lowercase without accents, so "pelicula" finds "Película".
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function BrowsePage() {
  const products = useAppSelector((state) => state.products.items);
 
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const selectedFranchise = searchParams.get("franchise") || "";
  // Kept in the URL so the results are still there after visiting a product.
  const query = searchParams.get("q") || "";
  const searchTerm = normalize(query.trim());

  const setQuery = (value: string) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("q", value);
        else params.delete("q");
        return params;
      },
      { replace: true }
    );

  // One entry per category slug, in the order set in the database.
  const categories = useMemo(() => {
    const bySlug = new Map<string, Category>();
    products.forEach((p) => {
      if (p.category) bySlug.set(p.category.slug, p.category);
    });

    return Array.from(bySlug.values()).sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        localize(a.name).localeCompare(localize(b.name))
    );
  }, [products]);

  const franchises = useMemo(() => {
    const unique = new Set(products.map((p) => p.franchise));
    return Array.from(unique);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory
        ? p.category?.slug === selectedCategory
        : true;

      const matchesFranchise = selectedFranchise
        ? p.franchise === selectedFranchise
        : true;

      const matchesSearch = searchTerm
        ? normalize(`${localize(p.name)} ${localize(p.description)}`).includes(searchTerm)
        : true;

      return matchesCategory && matchesFranchise && matchesSearch;
    });
  }, [products, selectedCategory, selectedFranchise, searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white rounded-2xl shadow-md p-6 h-fit lg:sticky lg:top-24">
        <h2 className="font-bold mb-4">{t.browse.categories}</h2>

        <button
          onClick={() =>
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              params.delete("category");
              return params;
            })
          }
          className={`block w-full text-left mb-2 ${!selectedCategory ? "text-purple-600 font-semibold" : ""
            }`}
        >
          {t.browse.all}
        </button>

        {categories.map((category) => (
          <button
            key={category.slug}
            onClick={() =>
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("category", category.slug);
                return params;
              })
            }
            className={`block w-full text-left mb-2 hover:text-purple-600 ${selectedCategory === category.slug
              ? "text-purple-600 font-semibold"
              : ""
              }`}
          >
            {localize(category.name)}
          </button>
        ))}
        <div className="mt-8">
          <h2 className="font-bold mb-4">{t.browse.franchises}</h2>

          <button
            onClick={() =>
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.delete("franchise");
                return params;
              })
            }
            className={`block w-full text-left mb-2 ${!selectedFranchise ? "text-purple-600 font-semibold" : ""
              }`}
          >
            {t.browse.all}
          </button>

          {franchises.map((franchise) => (
            <button
              key={franchise}
              onClick={() =>
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev);
                  params.set("franchise", franchise);
                  return params;
                })
              }
              className={`block w-full text-left mb-2 hover:text-purple-600 ${selectedFranchise === franchise
                  ? "text-purple-600 font-semibold"
                  : ""
                }`}
            >
              {franchise}
            </button>
          ))}
        </div>
      </aside>

      {/* Products */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-6 text-white">
          {t.browse.products}
        </h1>

        <div className="relative mb-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.browse.searchPlaceholder}
            aria-label={t.browse.searchPlaceholder}
            className="w-full rounded-xl px-4 py-3 pr-12 bg-white shadow-md outline-none focus:ring-2 focus:ring-purple-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.browse.clearSearch}
              title={t.browse.clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-purple-600"
            >
              ✕
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-white">
            {searchTerm ? t.browse.noResults(query.trim()) : t.browse.noProducts}
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}