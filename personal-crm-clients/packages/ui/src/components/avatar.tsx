import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Avatar({
  children,
  className,
  imageUrl,
  ...props
}: HTMLAttributes<HTMLDivElement> & { imageUrl?: string | null }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-accent text-sm font-semibold text-accent-foreground",
        className,
      )}
      {...props}
    >
      {imageUrl ? <img alt="" className="h-full w-full object-cover" src={imageUrl} /> : children}
    </div>
  );
}

