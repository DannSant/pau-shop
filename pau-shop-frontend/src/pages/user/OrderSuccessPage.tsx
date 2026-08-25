import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { fetchOrderDetail } from "../../features/orders/orderSlice";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const dispatch = useAppDispatch();

  const { orderDetail, orderDetailLoading, orderDetailError } = useAppSelector(
    (state) => state.order
  );
  const products = useAppSelector((state) => state.products.items);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetail(orderId));
    }
  }, [orderId, dispatch]);

  if (!orderId) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-white text-center">
        <h1 className="text-2xl font-bold mb-4">We couldn't find your order</h1>
        <Link
          to="/orders"
          className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          View my orders
        </Link>
      </div>
    );
  }

  if (orderDetailLoading || !orderDetail) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-white text-center">
        {orderDetailError ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Order not found</h1>
            <p className="text-white/70 mb-6">{orderDetailError}</p>
            <Link
              to="/orders"
              className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
            >
              View my orders
            </Link>
          </>
        ) : (
          <p>Loading your order...</p>
        )}
      </div>
    );
  }

  const orderDate = new Date(orderDetail.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paidDate = orderDetail.paid_at
    ? new Date(orderDetail.paid_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Thank you for your purchase!</h1>
        <p className="text-white/70">
          {paidDate
            ? `Your order was paid on ${paidDate}.`
            : "Your order has been placed successfully."}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <div>
            <p className="text-sm text-white/60">Order number</p>
            <p className="font-mono text-sm">{orderDetail.id}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Order date</p>
            <p>{orderDate}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-white/60">Payment status</p>
            <p className="capitalize">
              {orderDetail.status === "paid" ? `Paid${paidDate ? ` on ${paidDate}` : ""}` : orderDetail.status}
            </p>
          </div>
        </div>

        <hr className="border-white/20 mb-6" />

        <h2 className="text-xl font-semibold mb-4">Items</h2>

        <div className="space-y-3">
          {orderDetail.items.map((item) => {
            const product = products.find((p) => p.id === item.product_id);
            const images = product?.product_images ?? [];
            const thumbnail = images.find((img) => img.is_thumbnail)?.url || images[0]?.url;

            return (
              <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                <div className="flex items-center gap-4">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/10" />
                  )}
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-white/60">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p>${(item.unit_price * item.quantity).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <hr className="border-white/20 my-6" />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${orderDetail.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/orders"
          className="inline-block bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
