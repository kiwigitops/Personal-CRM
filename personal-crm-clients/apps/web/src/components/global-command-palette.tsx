"use client";

import { Button, Command as CommandIcon, Search } from "@personal-crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "./auth-provider";

export function GlobalCommandPalette({
  onOpenChange,
  open
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { api } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const search = useQuery({
    enabled: open && query.length > 1,
    queryFn: () => api.search(query),
    queryKey: ["global-search", query]
  });

  if (!open) {
    return null;
  }

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 p-4 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Search className="text-muted-foreground" size={18} />
            <Command.Input
              autoFocus
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onValueChange={setQuery}
              placeholder="Search contacts, companies, notes, follow-ups..."
              value={query}
            />
            <Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="ghost">
              Esc
            </Button>
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto p-3">
            <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
              {query.length > 1 ? "No results yet." : "Type to search or jump to a page."}
            </Command.Empty>
            <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              {[
                ["/dashboard", "Dashboard"],
                ["/contacts", "Contacts"],
                ["/followups", "Follow-ups"],
                ["/workspace", "Workspace settings"]
              ].map(([href, label]) => (
                <Command.Item
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm aria-selected:bg-muted"
                  key={href}
                  onSelect={() => go(href)}
                >
                  <CommandIcon size={16} />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>
            {search.data?.length ? (
              <Command.Group heading="Results" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {search.data.map((result) => (
                  <Command.Item
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-xl px-3 py-3 text-sm aria-selected:bg-muted"
                    key={`${result.type}-${result.id}`}
                    onSelect={() => go(result.href)}
                  >
                    <span className="font-semibold">{result.title}</span>
                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
