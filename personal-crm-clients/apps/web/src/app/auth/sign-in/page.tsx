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
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const { api, setSession } = useAuth();
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      email: "owner@personal-crm.local",
      password: "password123"
    },
    resolver: zodResolver(schema)
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await api.signIn(values);
      setSession(session);
      router.replace("/dashboard");
    } catch {
      toast.error("Unable to sign in. Check your credentials.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your relationship workspace.</CardDescription>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium">
            Email
            <Input autoComplete="email" {...form.register("email")} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Password
            <Input autoComplete="current-password" type="password" {...form.register("password")} />
          </label>
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/auth/forgot-password">Forgot password?</Link>
          <Link href="/auth/sign-up">Create account</Link>
        </div>
      </Card>
    </main>
  );
}

