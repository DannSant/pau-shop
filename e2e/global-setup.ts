import "./support/env";
import { db, resetData } from "../pau-shop-backend/tests/helpers/db";

// Start every run from an empty local database.
export default async function globalSetup() {
  await resetData();
  await db.end();
}
