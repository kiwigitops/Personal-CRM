"use client";

import { Badge, Button, Card, CardDescription, CardTitle } from "@personal-crm/ui";
import { formatRelativeLabel } from "@personal-crm/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";

export default function FollowupsPage() {
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const followups = useQuery({
    queryFn: () => api.listFollowups({ status: "PENDING" }),
    queryKey: ["followups", "PENDING"]
  });
  const complete = useMutation({
    mutationFn: (followupId: string) => api.completeFollowup(followupId),
    onSuccess: async () => {
      toast.success("Follow-up completed");
      await queryClient.invalidateQueries({ queryKey: ["followups"] });
    }
  });
  const now = Date.now();
  const groups = {
    "Overdue": followups.data?.filter((item) => new Date(item.dueAt).getTime() < now) ?? [],
    "Today": followups.data?.filter((item) => {
      const date = new Date(item.dueAt);
      return date.toDateString() === new Date().toDateString();
    }) ?? [],
    "Upcoming": followups.data?.filter((item) => new Date(item.dueAt).getTime() >= now) ?? []
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-primary">Kanban follow-up lane</p>
        <h1 className="font-display text-4xl font-semibold">Follow-ups</h1>
        <p className="text-muted-foreground">Clear overdue reminders and keep relationship momentum visible.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(groups).map(([label, items]) => (
          <Card className="min-h-[420px] space-y-4" key={label}>
            <div>
              <CardTitle className="flex items-center justify-between">
                {label}
                <Badge>{items.length}</Badge>
              </CardTitle>
              <CardDescription>{label === "Overdue" ? "Needs action first." : "Planned touchpoints."}</CardDescription>
            </div>
            <div className="space-y-3">
              {items.map((followup) => (
                <div className="space-y-3 rounded-2xl border border-border bg-background p-4" key={followup.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Link className="font-semibold hover:text-primary" href={`/contacts/${followup.contactId}`}>
                      {followup.contactName}
                    </Link>
                    <Badge>{followup.channel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{followup.prompt}</p>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{formatRelativeLabel(followup.dueAt)}</span>
                    <Button
                      disabled={complete.isPending}
                      onClick={() => complete.mutate(followup.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

