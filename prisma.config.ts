// Подключаем dotenv, чтобы process.env работал
import "dotenv/config";

// Импортируем defineConfig напрямую из prisma
import { defineConfig } from "prisma/config";

// Экспортируем конфиг Prisma
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Привязываем к DATABASE_URL из .env
    url: process.env.DATABASE_URL || "",
  },
});