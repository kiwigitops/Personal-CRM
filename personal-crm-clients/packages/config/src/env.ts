export function getRequiredEnv(name: string, env: Record<string, string | undefined>): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(
  name: string,
  env: Record<string, string | undefined>,
  fallback = "",
): string {
  return env[name] ?? fallback;
}

