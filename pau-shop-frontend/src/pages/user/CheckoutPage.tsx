import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { fetchOrderTotals } from "../../features/orders/orderSlice";
import AddressSection from "../../components/checkout/AddressSection";

import { resetCheckoutStatus, startCheckout } from "../../features/checkout/checkoutSlice";
import { cancelCheckout } from "../../api/payments";
import toast from "react-hot-toast";
import { t } from "../../i18n";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set by Stripe when the customer leaves the payment page without paying.
  const cancelledOrderId = searchParams.get("cancelled_order");

  const cartItems = useAppSelector((state) => state.cart.items);
  const totals = useAppSelector((state) => state.order.totals);
  const {
    address: selectedAddress,
    addressConfirmed,
    submitting,
    error,
  } = useAppSelector((state) => state.checkout);

  const dispatch = useAppDispatch();

  const [addressErrorRequested, setAddressErrorRequested] = useState(false);
  const addressReady = !!selectedAddress && addressConfirmed;
  const showAddressError = addressErrorRequested && !addressReady;

  useEffect(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    dispatch(fetchOrderTotals(subtotal));
  }, [cartItems, dispatch]);

  // Back from Stripe without paying: release the order's stock right away.
  const handledCancel = useRef<string | null>(null);
  useEffect(() => {
    if (!cancelledOrderId || handledCancel.current === cancelledOrderId) return;
    handledCancel.current = cancelledOrderId;

    cancelCheckout(cancelledOrderId)
      .then(({ status }) => {
        // The payment went through after all.
        if (status === "paid") navigate(`/order-success?order_id=${cancelledOrderId}`, { replace: true });
      })
      .catch(() => {
        // Not critical: unpaid orders are also released when the payment expires.
      });
  }, [cancelledOrderId, navigate]);

  // Errors from an earlier visit don't carry over.
  useEffect(() => {
    dispatch(resetCheckoutStatus());
  }, [dispatch]);

  // The browser's back button can restore this page from its cache with the
  // button still disabled.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) dispatch(resetCheckoutStatus());
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [dispatch]);

  const initCheckout = () => {
    if (!addressReady) {
      toast.error(t.checkout.selectAddressFirst);
      setAddressErrorRequested(true);
      return;
    }

    dispatch(startCheckout());
  }

  const shouldEnableCheckout = () => {
    return totals !== null && cartItems.length > 0 && !submitting;
  }

  // Prevent accessing checkout with empty cart
  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">

      <h1 className="text-3xl font-bold mb-10">
        {t.checkout.title}
      </h1>

      {cancelledOrderId && (
        <div role="status" className="mb-8 rounded-2xl border border-amber-400/40 bg-amber-500/20 text-amber-100 p-4">
          {t.checkout.paymentNotCompleted}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-10">

        {/* LEFT COLUMN (75%) */}
        <div className="space-y-8">

          {/* Shipping Address Section */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t.checkout.shippingAddress}
            </h2>

            <AddressSection />
          </div>

        </div>

        {/* RIGHT COLUMN (25%) */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 h-fit">

          <h2 className="text-xl font-semibold mb-6">
            {t.checkout.orderSummary}
          </h2>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>{t.checkout.subtotal}</span>
              <span>${totals?.subtotal?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>{t.checkout.tax}</span>
              <span>${totals?.tax?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>{t.checkout.importTax}</span>
              <span>${totals?.import_tax?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>{t.checkout.shipping}</span>
              <span>${totals?.shipping_fee?.toFixed(2)}</span>
            </div>

            <hr className="border-white/20 my-4" />

            <div className="flex justify-between font-bold text-lg">
              <span>{t.checkout.total}</span>
              <span>${totals?.total?.toFixed(2)}</span>
            </div>

          </div>

          <button
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 transition py-3 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={initCheckout}
            disabled={!shouldEnableCheckout()}
          >
            {submitting ? t.checkout.redirecting : t.checkout.payNow}
          </button>

          {showAddressError && (
            <p className="mt-2 text-red-500 text-sm text-center">
              {t.checkout.selectAddressFirst}
            </p>
          )}

          {error && !submitting && (
            <p role="alert" className="mt-3 text-red-300 text-sm text-center">
              {t.checkout.errors[error]}{" "}
              {(error === "outOfStock" || error === "productUnavailable") && (
                <Link to="/cart" className="underline">{t.orderSuccess.backToCart}</Link>
              )}
              {error === "phoneRequired" && (
                <Link to="/profile" className="underline">{t.navbar.profile}</Link>
              )}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}
