// src/routes.ts
import { Router } from "express";

import productsRouter from "./modules/products/products.routes";
import usersRouter from "./modules/users/users.routes";
import addressesRouter from "./modules/addresses/addresses.routes";
import ordersRouter from "./modules/orders/orders.routes";
import reviewsRouter from "./modules/reviews/reviews.routes";
import productImagesRouter from "./modules/product-images/product-images.routes";

const router = Router();

router.use("/products", productsRouter);
router.use("/users", usersRouter);
router.use("/addresses", addressesRouter);
router.use("/orders", ordersRouter);
router.use("/products/:id/reviews", reviewsRouter);
router.use("/products/:id/images", productImagesRouter);

export default router;
