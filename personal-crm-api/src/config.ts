import { z } from "zod";

const envSchema = z.object({
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(60),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  INTERNAL_API_KEY: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  MAIL_FROM: z.string().email(),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().default(1025),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().min(1),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().default(30)
});

export function getConfig() {
  const parsed = envSchema.parse(process.env);

  return {
    accessTokenTtlMinutes: parsed.ACCESS_TOKEN_TTL_MINUTES,
    appUrl: parsed.APP_URL,
    databaseUrl: parsed.DATABASE_URL,
    internalApiKey: parsed.INTERNAL_API_KEY,
    jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
    mailFrom: parsed.MAIL_FROM,
    mailHost: parsed.MAIL_HOST,
    mailPort: parsed.MAIL_PORT,
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    redisUrl: parsed.REDIS_URL,
    refreshTokenTtlDays: parsed.REFRESH_TOKEN_TTL_DAYS,
    resetTokenTtlMinutes: parsed.RESET_TOKEN_TTL_MINUTES
  };
}

