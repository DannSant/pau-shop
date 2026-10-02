import "./config/env";
import app from "./app";
import { reconcileStaleOrders } from "./modules/payments/payments.service";

const PORT = process.env.PORT || 4000;
const RECONCILE_EVERY_MS = 10 * 60 * 1000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// Settles unpaid orders whose Stripe notification never arrived.
const reconcile = () =>
  reconcileStaleOrders().catch((err) => console.error("Order reconciliation failed:", err.message));
reconcile();
setInterval(reconcile, RECONCILE_EVERY_MS);
