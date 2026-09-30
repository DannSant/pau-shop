import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { fetchMyOrders } from "../../features/orders/orderSlice";
import OrderStatusPill from "../orders/OrderStatusPill";
import { locale, localize, t } from "../../i18n";

const SUMMARY_MAX_NAMES = 3;

function summarizeItems(names: string[]) {
  const shown = names.slice(0, SUMMARY_MAX_NAMES).join(", ");
  const remaining = names.length - SUMMARY_MAX_NAMES;

  return remaining > 0 ? `${shown} ${t.orders.andMore(remaining)}` : shown;
}

export default function OrderHistoryTab() {
  const dispatch = useAppDispatch();
  const { myOrders, myOrdersLoading } = useAppSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (myOrdersLoading && myOrders.length === 0) {
    return <p>{t.orders.loading}</p>;
  }

  if (myOrders.length === 0) {
    return <p className="text-white/70">{t.orders.empty}</p>;
  }

  return (
    <div className="space-y-4">
      {myOrders.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="block bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/20 transition"
        >
          <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
            <p className="text-white/80">
              {new Date(order.created_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex items-center gap-4">
              <OrderStatusPill status={order.status} />
              <p className="font-bold">${order.total_amount.toFixed(2)}</p>
            </div>
          </div>

          <p className="text-sm text-white/60 truncate">
            {summarizeItems(
              (order.order_items ?? []).map((item) => localize(item.product_name))
            )}
          </p>
        </Link>
      ))}
    </div>
  );
}
