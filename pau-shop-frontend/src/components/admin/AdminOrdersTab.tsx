import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getAdminOrders, type AdminOrder } from "../../api/admin";
import { updateShippingStatus, type ShippingStatus } from "../../api/orders";
import OrderStatusPill from "../orders/OrderStatusPill";
import { locale, localize, t } from "../../i18n";
import { CARD, INPUT, LABEL, SECONDARY_BUTTON } from "./adminStyles";

const SHIPPING_STATUSES: ShippingStatus[] = ["pending", "shipped", "arrived"];
const PAYMENT_STATUSES = ["pending", "paid", "cancelled"];

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

function OrderCard({
  order,
  onShippingChange,
}: {
  order: AdminOrder;
  onShippingChange: (order: AdminOrder, status: ShippingStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const paid = order.status === "paid";
  const address = order.shipping_address;

  const handleChange = async (status: ShippingStatus) => {
    setSaving(true);
    await onShippingChange(order, status);
    setSaving(false);
  };

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{order.customer?.name ?? "—"}</p>
          <p className="text-sm text-white/60">
            {order.customer?.email}
            {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {new Date(order.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            <span className="font-mono">{order.id.slice(0, 8)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusPill status={order.status} />
          <p className="font-bold">{formatMoney(order.total_amount)}</p>
          <select
            className="p-2 rounded bg-gray-800 text-white text-sm"
            value={order.shipping_status}
            disabled={saving}
            onChange={(e) => handleChange(e.target.value as ShippingStatus)}
            title={paid ? undefined : t.admin.unpaidCannotShip}
          >
            {SHIPPING_STATUSES.map((status) => (
              <option key={status} value={status} disabled={!paid && status !== "pending"}>
                {t.orders.shippingStatuses[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className={`${SECONDARY_BUTTON} mt-4 text-sm`} onClick={() => setOpen(!open)}>
        {open ? t.admin.hideDetails : t.admin.showDetails}
      </button>

      {open && (
        <div className="grid gap-6 sm:grid-cols-2 mt-4 text-sm">
          <div>
            <p className="text-white/60 mb-1">{t.admin.shippingAddress}</p>
            {address ? (
              <>
                <p>
                  {address.first_name} {address.last_name} · {address.phone}
                </p>
                <p>
                  {address.street} {address.exterior_number}
                  {address.interior_number ? ` ${address.interior_number}` : ""}
                </p>
                <p>
                  {address.neighborhood}, {address.city}, {address.state} {address.postal_code}
                </p>
              </>
            ) : (
              <p>—</p>
            )}
          </div>

          <div>
            <p className="text-white/60 mb-1">{t.admin.items}</p>
            {order.order_items.map((item, index) => (
              <p key={index} className="flex justify-between gap-4">
                <span>
                  {item.quantity} × {localize(item.product_name)}
                </span>
                <span>{formatMoney(item.unit_price * item.quantity)}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersTab() {
  const [shippingFilter, setShippingFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const load = useCallback(
    () =>
      getAdminOrders({
        shipping_status: shippingFilter || undefined,
        payment_status: paymentFilter || undefined,
      }),
    [shippingFilter, paymentFilter]
  );
  const { data: orders, loading, failed, mutate } = useAsyncData(load);

  const handleShippingChange = async (order: AdminOrder, status: ShippingStatus) => {
    try {
      const updated = await updateShippingStatus(order.id, status);
      mutate((list) =>
        list.map((o) => (o.id === order.id ? { ...o, shipping_status: updated.shipping_status } : o))
      );
      toast.success(t.admin.shippingUpdated);
    } catch {
      toast.error(t.admin.shippingError);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-48">
          <label className={LABEL}>{t.admin.shippingFilter}</label>
          <select className={INPUT} value={shippingFilter} onChange={(e) => setShippingFilter(e.target.value)}>
            <option value="">{t.admin.allStatuses}</option>
            {SHIPPING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.orders.shippingStatuses[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className={LABEL}>{t.admin.paymentFilter}</label>
          <select className={INPUT} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="">{t.admin.allStatuses}</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.orders.status[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed ? (
        <p className="text-red-400">{t.admin.loadError}</p>
      ) : !orders ? (
        <p>{t.admin.loading}</p>
      ) : orders.length === 0 ? (
        <p className="text-white/70">{t.admin.noOrders}</p>
      ) : (
        <div className={`space-y-3 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onShippingChange={handleShippingChange} />
          ))}
        </div>
      )}
    </div>
  );
}
