import type { PrismaClient } from "../../generated/prisma";

import { MemPalaceMemoryProvider } from "./mempalace-memory-provider";
import type { MemoryProvider } from "./memory-provider";
import { NativeMemoryProvider } from "./native-memory-provider";

export function createMemoryProvider(prisma: PrismaClient): MemoryProvider {
  if (process.env.MEMORY_PROVIDER === "mempalace") {
    return new MemPalaceMemoryProvider(
      process.env.MEMPALACE_ENDPOINT ?? "",
      process.env.MEMPALACE_API_KEY ?? "",
    );
  }

  return new NativeMemoryProvider(prisma);
}
