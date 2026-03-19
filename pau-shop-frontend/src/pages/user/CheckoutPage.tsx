import { useEffect } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useNavigate } from "react-router-dom";
import { fetchOrderTotals } from "../../features/orders/orderSlice";
import AddressSection from "../../components/checkout/AddressSection";
import { formatAddress } from "../../types/address";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cartItems = useAppSelector((state) => state.cart.items);
  const totals = useAppSelector((state) => state.order.totals);
  const { address: selectedAddress } = useAppSelector(
        (state) => state.checkout
    );

  const dispatch = useAppDispatch(); 


  useEffect(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    dispatch(fetchOrderTotals(subtotal));
  }, [cartItems, dispatch]);

  const initCheckout = () => {
    console.log("Shipping to..." + formatAddress(selectedAddress))
  }

  // Prevent accessing checkout with empty cart
  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">

      <h1 className="text-3xl font-bold mb-10">
        Checkout
      </h1>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-10">

        {/* LEFT COLUMN (75%) */}
        <div className="space-y-8">

          {/* Shipping Address Section */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Shipping Address
            </h2>

            <AddressSection />
          </div>

        </div>

        {/* RIGHT COLUMN (25%) */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-fit">

          <h2 className="text-xl font-semibold mb-6">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>Subtotal</span>
             <span>${totals?.subtotal?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>CA Tax (8.5%)</span>
             <span>${totals?.tax?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Import Tax (16%)</span>
              <span>${totals?.import_tax?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${totals?.shipping_fee?.toFixed(2)}</span>
            </div>

            <hr className="border-white/20 my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totals?.total?.toFixed(2)}</span>
            </div>

          </div>

          <button className="mt-6 w-full bg-purple-600 hover:bg-purple-700 transition py-3 rounded-xl cursor-pointer" onClick={initCheckout}>
            Pay Now
          </button>

        </div>

      </div>

    </div>
  );
}