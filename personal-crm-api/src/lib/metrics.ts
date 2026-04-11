import { Counter, Registry, collectDefaultMetrics } from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestCounter = new Counter({
  help: "Number of API requests handled",
  labelNames: ["method", "route", "statusCode"],
  name: "personal_crm_api_requests_total",
  registers: [metricsRegistry]
});

