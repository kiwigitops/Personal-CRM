import { Card, CardDescription, CardTitle, ContactRound, Sparkles } from "@personal-crm/ui";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-soft">
            <Sparkles size={16} />
            Relationship intelligence, not spreadsheet maintenance
          </div>
          <div className="space-y-5">
            <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
              Keep the right people warm at the right moment.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Personal CRM brings contacts, follow-ups, notes, memory summaries, and agent-generated
              suggestions into one focused workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              href="/auth/sign-up"
            >
              Create workspace
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold shadow-soft transition hover:bg-muted"
              href="/auth/sign-in"
            >
              Sign in
            </Link>
          </div>
        </section>
        <Card className="relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/20 via-accent to-success/20" />
          <div className="relative space-y-5 p-6 pt-20">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ContactRound size={24} />
              </span>
              Today&apos;s relationship dashboard
            </CardTitle>
            <CardDescription>
              Overdue follow-ups, stale contacts, recent interactions, and next-best actions are ready
              as soon as the workspace opens.
            </CardDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["7", "Warm relationships"],
                ["3", "Due today"],
                ["12", "Interactions this month"],
                ["4", "Agent suggestions"]
              ].map(([value, label]) => (
                <div className="rounded-2xl bg-muted p-4" key={label}>
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
