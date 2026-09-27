import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.NEON_DB_URL || process.env.DATABASE_URL || "",
  },
});

