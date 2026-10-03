import { Request, Response, Router } from "express";
import { stripe } from "../../lib/stripe";
import { fakeStripeControl } from "../../lib/stripe.fake";

// Stand-in for Stripe's payment page in end-to-end tests (STRIPE_MODE=fake
// only; see routes.ts). "Pay" and "expire" notify our own webhook with a
// signed event, exactly like Stripe would.
const router = Router();

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function notifyWebhook(req: Request, type: string, sessionId: string) {
  const session = fakeStripeControl.get(sessionId);
  const payload = JSON.stringify({
    id: `evt_fake_${Date.now()}`,
    object: "event",
    type,
    data: { object: session }
  });
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!
  });

  const response = await fetch(`${req.protocol}://${req.get("host")}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": header },
    body: payload
  });
  if (!response.ok) throw new Error(`Webhook answered ${response.status}`);
}

router.get("/:id", (req: Request, res: Response) => {
  const session = fakeStripeControl.get(String(req.params.id));
  if (!session) return res.status(404).send("Unknown session");

  const lines = session.line_items
    .map((l) => `<li>${escape(l.description)} × ${l.quantity}: <span>${(l.amount_total / 100).toFixed(2)}</span></li>`)
    .join("");

  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Fake Stripe</title></head>
<body>
  <h1>Fake Stripe</h1>
  <p>Estado: <strong id="status">${session.status}</strong></p>
  <ul>${lines}</ul>
  <p>Total: <strong id="total">${session.currency.toUpperCase()} ${(session.amount_total / 100).toFixed(2)}</strong></p>
  <form method="post" action="${session.id}/pay"><button type="submit">Pagar</button></form>
  <a id="back" href="${escape(session.cancel_url ?? "/")}">Volver</a>
</body></html>`);
});

router.post("/:id/pay", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const session = fakeStripeControl.get(id);
  if (!session || session.status !== "open") return res.status(409).send("Session is not open");

  fakeStripeControl.complete(id);
  await notifyWebhook(req, "checkout.session.completed", id);
  res.redirect(303, session.success_url ?? "/");
});

// Lets a test skip the 31-minute wait.
router.post("/:id/expire", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!fakeStripeControl.get(id)) return res.status(404).send("Unknown session");

  fakeStripeControl.expire(id);
  await notifyWebhook(req, "checkout.session.expired", id);
  res.json({ status: "expired" });
});

export default router;
