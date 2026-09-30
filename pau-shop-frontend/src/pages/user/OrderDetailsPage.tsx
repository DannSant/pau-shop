import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { fetchOrderDetail } from "../../features/orders/orderSlice";
import OrderStatusPill from "../../components/orders/OrderStatusPill";
import { locale, t } from "../../i18n";

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const { orderDetail, orderDetailLoading, orderDetailError } = useAppSelector(
    (state) => state.order
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetail(id));
    }
  }, [id, dispatch]);

  const backLink = (
    <Link
      to="/profile?tab=orders"
      className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
    >
      {t.orders.back}
    </Link>
  );

  // The store may still hold a previously viewed order, so match on the id.
  const order = orderDetail?.id === id ? orderDetail : undefined;

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-white text-center">
        {orderDetailError && !orderDetailLoading ? (
          <>
            <h1 className="text-2xl font-bold mb-6">{t.orders.notFound}</h1>
            {backLink}
          </>
        ) : (
          <p>{t.orders.detailLoading}</p>
        )}
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const breakdown = [
    { label: t.orders.subtotal, amount: order.subtotal },
    { label: t.orders.tax, amount: order.tax },
    { label: t.orders.importTax, amount: order.import_tax },
    { label: t.orders.shipping, amount: order.shipping_fee },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-8">{t.orders.detailTitle}</h1>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <p className="text-sm text-white/60">{t.orders.orderNumber}</p>
            <p className="font-mono text-sm">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">{t.orders.date}</p>
            <p>{orderDate}</p>
          </div>
          <OrderStatusPill status={order.status} />
        </div>

        <hr className="border-white/20 mb-6" />

        <h2 className="text-xl font-semibold mb-4">{t.orders.items}</h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/10" />
                )}
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-white/60">
                    {t.orders.quantity}: {item.quantity} × {formatMoney(item.unit_price)}
                  </p>
                </div>
              </div>
              <p>{formatMoney(item.unit_price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <hr className="border-white/20 my-6" />

        <div className="space-y-2 text-sm">
          {breakdown.map((row) => (
            <div key={row.label} className="flex justify-between text-white/80">
              <span>{row.label}</span>
              <span>{formatMoney(row.amount)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-bold text-lg mt-4">
          <span>{t.orders.total}</span>
          <span>{formatMoney(order.total_amount)}</span>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">{t.orders.shippingStatus}</h2>
        <p className="text-white/60">{t.orders.comingSoon}</p>
      </div>

      <div className="text-center">{backLink}</div>
    </div>
  );
}
