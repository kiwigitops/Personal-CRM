"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Card, CardDescription, CardTitle, Input } from "@personal-crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth-provider";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"])
});

export default function WorkspacePage() {
  const { api, user } = useAuth();
  const queryClient = useQueryClient();
  const members = useQuery({
    queryFn: () => api.listWorkspaceMembers(),
    queryKey: ["workspace-members"]
  });
  const form = useForm<z.infer<typeof inviteSchema>>({
    defaultValues: {
      email: "",
      role: "MEMBER"
    },
    resolver: zodResolver(inviteSchema)
  });
  const invite = useMutation({
    mutationFn: (values: z.infer<typeof inviteSchema>) => api.inviteMember(values),
    onSuccess: async (result) => {
      toast.success(`Invitation token generated: ${result.inviteToken.slice(0, 10)}...`);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    }
  });
  const seedDemo = useMutation({
    mutationFn: () => api.enqueueDemoSeed(),
    onSuccess: (result) => toast.success(`Seed job queued: ${result.jobId}`)
  });

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-soft">
        <p className="text-sm font-semibold text-primary">Workspace administration</p>
        <h1 className="font-display text-4xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Invite teammates, view roles, seed demos, and verify profile context.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="space-y-4">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>Basic RBAC with owner, admin, and member roles.</CardDescription>
          </div>
          <div className="divide-y divide-border">
            {members.data?.map((member) => (
              <div className="flex items-center justify-between gap-4 py-4" key={member.id}>
                <div>
                  <p className="font-semibold">{member.fullName}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Badge>{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <div>
              <CardTitle>Invite member</CardTitle>
              <CardDescription>Local dev sends invite mail to MailHog and returns a token.</CardDescription>
            </div>
            <form className="space-y-3" onSubmit={form.handleSubmit((values) => invite.mutate(values))}>
              <Input placeholder="teammate@example.com" {...form.register("email")} />
              <select className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...form.register("role")}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <Button className="w-full" disabled={invite.isPending} type="submit">
                Send invite
              </Button>
            </form>
          </Card>

          <Card className="space-y-4">
            <div>
              <CardTitle>Developer demo</CardTitle>
              <CardDescription>Queue the seed-data-agent for realistic contacts and timelines.</CardDescription>
            </div>
            <Button disabled={seedDemo.isPending} onClick={() => seedDemo.mutate()} type="button" variant="secondary">
              Queue demo seed
            </Button>
          </Card>

          <Card className="space-y-2">
            <CardTitle>Profile</CardTitle>
            <p className="text-sm text-muted-foreground">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </Card>
        </aside>
      </section>
    </div>
  );
}
