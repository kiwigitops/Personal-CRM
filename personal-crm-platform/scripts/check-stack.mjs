const checks = [
  ["web via proxy", "http://localhost:8080/healthz"],
  ["api live via proxy", "http://localhost:8080/api/v1/health/live"],
  ["api ready via proxy", "http://localhost:8080/api/v1/health/ready"],
  ["api direct ready", "http://localhost:4000/v1/health/ready"],
  ["agents ready", "http://localhost:4100/health/ready"],
  ["mailhog", "http://localhost:8025/api/v2/messages"],
  ["minio ready", "http://localhost:9000/minio/health/ready"],
  ["prometheus ready", "http://localhost:9090/-/ready"],
  ["grafana health", "http://localhost:3001/api/health"]
];

const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 5000);

async function check(name, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });
    return {
      name,
      ok: response.ok,
      status: response.status,
      url
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      name,
      ok: false,
      status: 0,
      url
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = await Promise.all(checks.map(([name, url]) => check(name, url)));

for (const result of results) {
  const status = result.ok ? "ok" : "fail";
  const details = result.error ? ` (${result.error})` : "";
  console.log(`${status.padEnd(4)} ${result.name.padEnd(18)} ${result.status} ${result.url}${details}`);
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}
