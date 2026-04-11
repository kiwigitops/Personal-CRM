import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function toJsonSchema(name: string, schema: z.ZodTypeAny) {
  const convert = zodToJsonSchema as unknown as (
    value: unknown,
    options: Record<string, unknown>,
  ) => Record<string, unknown>;

  return convert(schema, {
    $refStrategy: "none",
    name
  });
}

export const pagingQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
