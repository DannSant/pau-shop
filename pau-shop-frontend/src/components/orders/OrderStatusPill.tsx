import { t } from "../../i18n";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-400/40",
  paid: "bg-green-500/20 text-green-300 border-green-400/40",
  shipped: "bg-blue-500/20 text-blue-300 border-blue-400/40",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-400/40",
};

const FALLBACK_STYLE = "bg-gray-500/20 text-gray-300 border-gray-400/40";

export default function OrderStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
        STATUS_STYLES[status] ?? FALLBACK_STYLE
      }`}
    >
      {t.orders.status[status] ?? status}
    </span>
  );
}
