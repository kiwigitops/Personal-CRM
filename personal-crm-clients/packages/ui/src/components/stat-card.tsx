import type { ReactNode } from "react";

import { Card } from "./card";

export function StatCard({
  helper,
  icon,
  label,
  value
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <div className="rounded-2xl bg-muted p-3 text-muted-foreground">{icon}</div>
    </Card>
  );
}

