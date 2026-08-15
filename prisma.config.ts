import { config } from "dotenv";
config();
config({ path: ".env.local", override: true });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Conexion directa (sin pooler) para push/migrate: Neon recomienda no
    // usar la conexion pooleada para operaciones DDL.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
