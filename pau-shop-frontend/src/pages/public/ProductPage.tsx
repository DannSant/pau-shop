import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppSelector } from "../../hooks/useAppSelector";
import ProductCard from "../../components/product/ProductCard";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { addToCart } from "../../features/cart/cartSlice";
import { t } from "../../i18n";
import toast from "react-hot-toast";

export default function ProductPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.items);
  const cartItems = useAppSelector((state) => state.cart.items);
  const loading = useAppSelector((state) => state.products.loading);

  const product = products.find((p) => p.id === id);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);



  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(
      (p) =>
        p.franchise === product.franchise &&
        p.id !== product.id
    );
  }, [products, product]);

  if (!product) return <div className="p-10">Producto no encontrado</div>;

  const cartItem = cartItems.find(
    (item) => item.product_id === product.id
  );

  const quantityInCart = cartItem?.quantity || 0;

  const remainingStock = product.stock - quantityInCart;

  const images = product.product_images;
  const thumbnail =
    images.find((img) => img.is_thumbnail)?.url ||
    images[0]?.url;

  const currentImage = selectedImage || thumbnail;

  const handleAddToCart = () => {
     if (remainingStock <= 0) return;

    dispatch(
      addToCart({
        product_id: product.id,
        name: product.name,
        price: product.offer_price ?? product.price,
        quantity: 1,
      })
    );
    toast.success(`${product.name} added to cart`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[100px_1fr_420px] gap-10">
        {/* LEFT - Thumbnails */}
        <div className="flex lg:flex-col gap-4 order-2 lg:order-1">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={product.name}
              onClick={() => setSelectedImage(img.url)}
              className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${currentImage === img.url
                ? "border-purple-600"
                : "border-transparent"
                }`}
            />
          ))}
        </div>

        {/* CENTER - Main Image */}
        <div className="order-1 lg:order-2">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full rounded-2xl shadow-md"
          />
        </div>

        {/* RIGHT - Details */}
        <div className="order-3 bg-white rounded-2xl shadow-lg p-8 h-fit">
          <h1 className="text-3xl font-bold mb-4">
            {product.name}
          </h1>

          <p className="text-gray-600 mb-6">
            {product.description}
          </p>

          <div className="mb-6">
            {product.offer_price ? (
              <div className="flex items-center gap-4">
                <span className="line-through text-gray-400">
                  ${product.price}
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  ${product.offer_price}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold">
                ${product.price}
              </span>
            )}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={remainingStock <= 0}
              className={`cursor-pointer px-6 py-3 rounded-xl transition text-white ${ remainingStock <= 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
                }`}
            >
              {remainingStock <= 0 ? (`${t.product.outOfStock}`) : (`${t.product.addToCart}`)}
            </button>

            {cartItems.length > 0 && (
              <button className="cursor-pointer border border-purple-600 text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 transition">
                {t.product.checkout}
              </button>
            )}
          </div>
          <div className="mb-4">
            { remainingStock  > 0 ? (
              <span className="text-green-600 text-sm font-medium">
               {t.product.inStock} ({remainingStock})
              </span>
            ) : (
              <span className="text-red-500 text-sm font-medium">
                {t.product.outOfStock}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">
            Similar Products
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}