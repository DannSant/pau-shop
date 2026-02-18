import { useEffect, useState } from "react";
import { getProducts } from "../../api/products";
import { type Product } from "../../types/product";
import ProductCard from "../../components/product/ProductCard";
import { t } from "../../i18n";

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((products) => {
        const featuredProducts = products.filter(
          (p) => p.offer_price !== null
        );

        setFeatured(featuredProducts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-purple-600">
            {t.home.title}
        </h1>

        <p className="text-gray-600 max-w-xl">
            {t.home.description}
        </p>
      </section>

      {/* Featured Section */}
      <section>
        <h2 className="text-2xl font-bold mb-8">
          {t.home.featured}
        </h2>

        {loading ? (
          <p>Cargando productos...</p>
        ) : featured.length === 0 ? (
          <p>No hay productos destacados.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
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
