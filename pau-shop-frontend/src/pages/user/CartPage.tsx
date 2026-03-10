import {  useDispatch } from "react-redux";
import { useAppSelector } from "../../hooks/useAppSelector";
import { addToCart, removeFromCart, type CartItem } from  "../../features/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { t } from "../../i18n";
import toast from "react-hot-toast";
export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const items = useAppSelector((state) => state.cart.items);
  const products = useAppSelector((state) => state.products.items);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleAddProduct = (item: CartItem)=>{
    const product = products.find(p=>p.id === item.product_id);
    if(!product) {
        toast.error("Product not found");
        return;
    }

    const quantityInCart = item.quantity;
    const remainingStock = product.stock - quantityInCart;
    if(remainingStock <= 0) {
        toast.error("Insufficient stock");
        return;
    }
    dispatch(addToCart({...item, quantity: 1}));
  }

  if (items.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-2xl text-white font-bold mb-4">{t.cart.empty}</h1>
        <button
          onClick={() => navigate("/browse")}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer"
        >
            {t.cart.browse}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      <h1 className="text-3xl text-white font-bold mb-8">{t.cart.yourCart}</h1>

      <div className="space-y-6">

        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow"
          >

            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-gray-500">${item.price}</p>
            </div>

            <div className="flex items-center gap-4">

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    dispatch(
                      addToCart({
                        ...item,
                        quantity: -1
                      })
                    )
                  }
                  className="px-3 py-1 bg-gray-200 rounded cursor-pointer"
                >
                  -
                </button>

                <span>{item.quantity}</span>

                <button
                  onClick={() =>
                    handleAddProduct(item)
                  }
                  className="px-3 py-1 bg-gray-200 rounded cursor-pointer"
                >
                  +
                </button>

              </div>

              <button
                onClick={() => dispatch(removeFromCart(item.product_id))}
                className="text-red-500 cursor-pointer"
              >
                {t.cart.remove}
              </button>

            </div>

          </div>
        ))}

      </div>

      <div className="mt-8 flex justify-between items-center">

        <h2 className="text-xl text-white font-bold">
          {t.cart.total}: ${total.toFixed(2)}
        </h2>

        <button
          onClick={() => navigate("/checkout")}
          className="bg-green-600 text-white px-6 py-3 rounded-xl cursor-pointer"
        >
          {t.cart.checkout}
        </button>

      </div>

    </div>
  );
}