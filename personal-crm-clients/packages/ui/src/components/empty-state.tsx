import type { ReactNode } from "react";

import { Button } from "./button";
import { Card, CardDescription, CardTitle } from "./card";

export function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
  visual
}: {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
  visual?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 border-dashed bg-background/50">
      {visual}
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} type="button" variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}

