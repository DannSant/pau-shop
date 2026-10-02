import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { fetchOrderDetail } from "../../features/orders/orderSlice";
import { clearCart } from "../../features/cart/cartSlice";
import { locale, localize, t } from "../../i18n";

const CONFIRMATION_CHECK_MS = 2000;
const MAX_CONFIRMATION_CHECKS = 15; // about 30 seconds

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const dispatch = useAppDispatch();

  const { orderDetail: loadedOrder, orderDetailError } = useAppSelector(
    (state) => state.order
  );
  // Ignore a different order still in the store from an earlier page.
  const orderDetail = loadedOrder?.id === orderId ? loadedOrder : null;
  const status = orderDetail?.status;

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetail(orderId));
    }
  }, [orderId, dispatch]);

  // Stripe's confirmation can arrive a few seconds after the customer gets
  // here: check again for a while before saying it's still processing.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (!orderId || status !== "pending") return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > MAX_CONFIRMATION_CHECKS) {
        window.clearInterval(timer);
        setGaveUp(true);
        return;
      }
      dispatch(fetchOrderDetail(orderId));
    }, CONFIRMATION_CHECK_MS);

    return () => window.clearInterval(timer);
  }, [orderId, status, dispatch]);

  // The cart is saved across visits, so empty it once the payment is
  // confirmed (not before: the payment may still fail).
  const paidOrderId = status === "paid" ? orderId : null;
  useEffect(() => {
    if (paidOrderId) {
      dispatch(clearCart());
    }
  }, [paidOrderId, dispatch]);

  if (!orderId) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-white text-center">
        <h1 className="text-2xl font-bold mb-4">{t.orderSuccess.notFound}</h1>
        <Link
          to="/profile?tab=orders"
          className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          {t.orderSuccess.viewOrders}
        </Link>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-white text-center">
        {orderDetailError ? (
          <>
            <h1 className="text-2xl font-bold mb-6">{t.orderSuccess.notFound}</h1>
            <Link
              to="/profile?tab=orders"
              className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
            >
              {t.orderSuccess.viewOrders}
            </Link>
          </>
        ) : (
          <p>{t.orders.detailLoading}</p>
        )}
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-white text-center">
        <h1 className="text-2xl font-bold mb-3">{t.orderSuccess.notCompletedTitle}</h1>
        <p className="text-white/70 mb-8">{t.orderSuccess.notCompletedBody}</p>
        <Link
          to="/cart"
          className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          {t.orderSuccess.backToCart}
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-white text-center" role="status">
        {gaveUp ? (
          <>
            <p className="text-white/80 mb-8">{t.orderSuccess.stillProcessing}</p>
            <Link
              to="/profile?tab=orders"
              className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
            >
              {t.orderSuccess.viewOrders}
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 h-10 w-10 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">{t.orderSuccess.confirming}</h1>
            <p className="text-white/70">{t.orderSuccess.confirmingBody}</p>
          </>
        )}
      </div>
    );
  }

  const orderDate = new Date(orderDetail.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paidDate = orderDetail.paid_at
    ? new Date(orderDetail.paid_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">{t.orderSuccess.title}</h1>
        <p className="text-white/70">
          {paidDate
            ? t.orderSuccess.paidOn(paidDate)
            : t.orderSuccess.placed}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <div>
            <p className="text-sm text-white/60">{t.orders.orderNumber}</p>
            <p className="font-mono text-sm">{orderDetail.id}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">{t.orderSuccess.orderDate}</p>
            <p>{orderDate}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-white/60">{t.orderSuccess.paymentStatus}</p>
            <p>
              {orderDetail.status === "paid" && paidDate
                ? t.orderSuccess.paidOnShort(paidDate)
                : t.orders.status[orderDetail.status] ?? orderDetail.status}
            </p>
          </div>
        </div>

        <hr className="border-white/20 mb-6" />

        <h2 className="text-xl font-semibold mb-4">{t.orders.items}</h2>

        <div className="space-y-3">
          {orderDetail.items.map((item) => {
            return (
              <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                <div className="flex items-center gap-4">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={localize(item.product_name)}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/10" />
                  )}
                  <div>
                    <p className="font-medium">{localize(item.product_name)}</p>
                    <p className="text-white/60">{t.orders.quantity}: {item.quantity}</p>
                  </div>
                </div>
                <p>${(item.unit_price * item.quantity).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <hr className="border-white/20 my-6" />

        <div className="flex justify-between font-bold text-lg">
          <span>{t.orders.total}</span>
          <span>${orderDetail.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/profile?tab=orders"
          className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          {t.orderSuccess.viewOrders}
        </Link>
      </div>
    </div>
  );
}
