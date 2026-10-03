import { requireUuidParam } from "./utils/ids";
// src/routes.ts
import { Router } from "express";

import productsRouter from "./modules/products/products.routes";
import categoriesRouter from "./modules/categories/categories.routes";
import usersRouter from "./modules/users/users.routes";
import addressesRouter from "./modules/addresses/addresses.routes";
import ordersRouter from "./modules/orders/orders.routes";
import reviewsRouter from "./modules/reviews/reviews.routes";
import moderationRouter from "./modules/moderation/moderation.routes";
import productImagesRouter from "./modules/product-images/product-images.routes";
import paymentsRouter from "./modules/payments/payments.routes";
import webhooksRouter from "./modules/webhooks/webhooks.routes";
import testStripeRouter from "./modules/test-stripe/test-stripe.routes";
import { usingFakeStripe } from "./lib/stripe";

const router = Router();
router.param("id", requireUuidParam);

router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/addresses", addressesRouter);
router.use("/orders", ordersRouter);
router.use("/products/:id/reviews", reviewsRouter);
router.use("/moderation", moderationRouter);
router.use("/products/:id/images", productImagesRouter);
router.use("/payments", paymentsRouter);

router.use("/webhooks", webhooksRouter);

// Fake Stripe payment page, only when tests run with STRIPE_MODE=fake.
if (usingFakeStripe) {
  router.use("/__test/stripe", testStripeRouter);
}


export default router;
