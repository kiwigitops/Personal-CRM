"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardTitle,
  Clock3,
  ContactRound,
  Flame,
  LineChart,
  StatCard
} from "@personal-crm/ui";
import { formatRelativeLabel } from "@personal-crm/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { api } = useAuth();
  const dashboard = useQuery({
    queryFn: () => api.getDashboard(),
    queryKey: ["dashboard"]
  });

  if (dashboard.isLoading) {
    return <DashboardSkeleton />;
  }

  const data = dashboard.data;

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-primary">Today&apos;s relationship cockpit</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Focus on the relationships that need momentum.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Follow-ups, stale contacts, memory summaries, and agent suggestions are prioritized for the
          active workspace.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard helper="CRM records" icon={<ContactRound size={18} />} label="Contacts" value={data?.metrics.totalContacts ?? 0} />
        <StatCard helper="Score 65+" icon={<Flame size={18} />} label="Warm" value={data?.metrics.warmContacts ?? 0} />
        <StatCard helper="Need action" icon={<Clock3 size={18} />} label="Overdue" value={data?.metrics.overdueCount ?? 0} />
        <StatCard helper="This month" icon={<LineChart size={18} />} label="Interactions" value={data?.metrics.interactionsThisMonth ?? 0} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Today and overdue</CardTitle>
            <CardDescription>High-signal follow-ups to clear first.</CardDescription>
          </div>
          <div className="space-y-3">
            {[...(data?.overdueFollowups ?? []), ...(data?.todaysFollowups ?? [])].slice(0, 8).map((followup) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4 transition hover:border-primary"
                href={`/contacts/${followup.contactId}`}
                key={followup.id}
              >
                <div>
                  <p className="font-semibold">{followup.contactName}</p>
                  <p className="text-sm text-muted-foreground">{followup.prompt}</p>
                </div>
                <Badge>{formatRelativeLabel(followup.dueAt)}</Badge>
              </Link>
            ))}
            {!data?.overdueFollowups.length && !data?.todaysFollowups.length ? (
              <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                No urgent follow-ups. Nice work.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Suggested actions</CardTitle>
            <CardDescription>Generated from follow-up urgency and relationship health.</CardDescription>
          </div>
          <div className="space-y-3">
            {data?.suggestedActions.map((action) => (
              <Link
                className="block rounded-2xl bg-muted p-4 transition hover:bg-accent"
                href={action.contactId ? `/contacts/${action.contactId}` : "/contacts"}
                key={action.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{action.title}</p>
                  <Badge>{action.priority}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <CardTitle>Stale contacts</CardTitle>
            <CardDescription>Relationships with no recent logged touchpoint.</CardDescription>
          </div>
          <div className="space-y-3">
            {data?.staleContacts.map((contact) => (
              <Link
                className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                href={`/contacts/${contact.id}`}
                key={contact.id}
              >
                <div>
                  <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                  <p className="text-sm text-muted-foreground">{contact.companyName ?? "No company"}</p>
                </div>
                <Badge>{contact.staleDays}d stale</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Recent interactions</CardTitle>
            <CardDescription>Fresh context from your relationship timeline.</CardDescription>
          </div>
          <div className="space-y-3">
            {data?.recentInteractions.map((interaction) => (
              <div className="rounded-2xl border border-border bg-background p-4" key={interaction.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{interaction.title}</p>
                  <Badge>{interaction.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatRelativeLabel(interaction.happenedAt)} by {interaction.createdByName}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-32 animate-pulse rounded-2xl bg-muted" key={index} />
      ))}
    </div>
  );
}
