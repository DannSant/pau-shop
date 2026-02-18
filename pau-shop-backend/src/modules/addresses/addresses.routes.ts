import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  listMyAddresses,
  createAddressHandler,
  updateAddressHandler,
  deleteAddressHandler
} from "./addresses.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listMyAddresses);
router.post("/", createAddressHandler);
router.put("/:id", updateAddressHandler);
router.delete("/:id", deleteAddressHandler);

export default router;
