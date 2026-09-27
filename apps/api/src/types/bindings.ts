import type { D1Database } from "@cloudflare/workers-types";

export type Bindings = {
  meal_count_db: D1Database;
};
