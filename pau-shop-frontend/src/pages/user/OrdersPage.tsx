import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { fetchMyOrders } from "../../features/orders/orderSlice";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { myOrders, myOrdersLoading } = useAppSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {myOrdersLoading ? (
        <p>Loading your orders...</p>
      ) : myOrders.length === 0 ? (
        <p className="text-white/70">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
            <Link
              key={order.id}
              to={`/order-success?order_id=${order.id}`}
              className="block bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <p className="text-sm text-white/60">Order number</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Date</p>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-white/60">Status</p>
                  <p className="capitalize">{order.status}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-white/60">Total</p>
                  <p className="font-bold">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
