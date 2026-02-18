import { Link } from "react-router-dom";
import { type Product } from "../../types/product";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const hasOffer = product.offer_price !== null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 flex flex-col"
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
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
    </Link>
  );
}
