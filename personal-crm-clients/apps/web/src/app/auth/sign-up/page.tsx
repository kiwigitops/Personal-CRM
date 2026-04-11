"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardDescription, CardTitle, Input } from "@personal-crm/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth-provider";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  workspaceName: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const { api, setSession } = useAuth();
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      workspaceName: ""
    },
    resolver: zodResolver(schema)
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await api.signUp(values);
      setSession(session);
      router.replace("/dashboard");
    } catch {
      toast.error("Unable to create workspace.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl">Create your CRM</CardTitle>
          <CardDescription>Start with one workspace and invite teammates later.</CardDescription>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium">
            Full name
            <Input autoComplete="name" {...form.register("fullName")} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Email
            <Input autoComplete="email" {...form.register("email")} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Workspace
            <Input {...form.register("workspaceName")} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Password
            <Input autoComplete="new-password" type="password" {...form.register("password")} />
          </label>
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Creating..." : "Create workspace"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/auth/sign-in">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}

