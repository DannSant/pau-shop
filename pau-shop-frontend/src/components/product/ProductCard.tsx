import { Link } from "react-router-dom";
import { type Product } from "../../types/product";
import { t } from "../../i18n";
interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const hasOffer = product.offer_price !== null;

  // Get thumbnail or fallback
  const thumbnail =
    product.product_images.find((img) => img.is_thumbnail) ||
    product.product_images[0];

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="w-full aspect-square bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            {t.common.noImage}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-500 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4">
          {hasOffer ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 line-through">
                ${product.price}
              </span>
              <span className="text-purple-600 font-bold text-lg">
                ${product.offer_price}
              </span>
            </div>
          ) : (
            <span className="font-bold text-lg">
              ${product.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}