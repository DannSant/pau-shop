import { t } from "../../i18n";

const AMBER = "bg-amber-500/20 text-amber-300 border-amber-400/40";
const GREEN = "bg-green-500/20 text-green-300 border-green-400/40";
const PURPLE = "bg-purple-500/30 text-purple-200 border-purple-300/50";
const GRAY = "bg-gray-500/20 text-gray-300 border-gray-400/40";

// "payment" shows orders.status, "shipping" shows orders.shipping_status.
const PILLS = {
  payment: {
    styles: { pending: AMBER, paid: GREEN } as Record<string, string>,
    labels: t.orders.status,
  },
  shipping: {
    styles: { pending: GRAY, shipped: PURPLE, arrived: GREEN } as Record<string, string>,
    labels: t.orders.shippingStatuses,
  },
};

interface Props {
  status: string;
  kind?: keyof typeof PILLS;
}

export default function OrderStatusPill({ status, kind = "payment" }: Props) {
  const { styles, labels } = PILLS[kind];

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
        styles[status] ?? GRAY
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
