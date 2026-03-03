import {  useMemo } from "react";
import ProductCard from "../../components/product/ProductCard";
import { useSearchParams } from "react-router-dom";
import { t } from "../../i18n";
import { useAppSelector } from "../../hooks/useAppSelector";

export default function BrowsePage() {
  const products = useAppSelector((state) => state.products.items);
 
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const selectedFranchise = searchParams.get("franchise") || "";

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return Array.from(unique);
  }, [products]);

  const franchises = useMemo(() => {
    const unique = new Set(products.map((p) => p.franchise));
    return Array.from(unique);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory
        ? p.category === selectedCategory
        : true;

      const matchesFranchise = selectedFranchise
        ? p.franchise === selectedFranchise
        : true;

      return matchesCategory && matchesFranchise;
    });
  }, [products, selectedCategory, selectedFranchise]);  

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white rounded-2xl shadow-md p-6 h-fit lg:sticky lg:top-24">
        <h2 className="font-bold mb-4">{t.browswe.categories}</h2>

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
          {t.browswe.all}
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("category", category);
                return params;
              })
            }
            className={`block w-full text-left mb-2 hover:text-purple-600 ${selectedCategory === category
              ? "text-purple-600 font-semibold"
              : ""
              }`}
          >
            {category}
          </button>
        ))}
        <div className="mt-8">
          <h2 className="font-bold mb-4">Franquicias</h2>

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
            Todas
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
        <h1 className="text-2xl font-bold mb-8 text-white">
          {t.browswe.products}
        </h1>

        {filteredProducts.length === 0 ? (
          <p>{t.browswe.noProducts}</p>
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