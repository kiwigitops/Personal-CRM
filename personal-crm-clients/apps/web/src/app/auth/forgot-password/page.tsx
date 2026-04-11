"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardDescription, CardTitle, Input } from "@personal-crm/ui";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth-provider";

const schema = z.object({
  email: z.string().email()
});

export default function ForgotPasswordPage() {
  const { api } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: ""
    },
    resolver: zodResolver(schema)
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await api.forgotPassword(values);
    toast.success("If the account exists, a reset token was sent to the local mail catcher.");
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <CardTitle className="font-display text-3xl">Reset password</CardTitle>
          <CardDescription>Local development sends reset mail to MailHog.</CardDescription>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium">
            Email
            <Input autoComplete="email" {...form.register("email")} />
          </label>
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            Send reset email
          </Button>
        </form>
        <Link className="text-sm text-muted-foreground" href="/auth/sign-in">
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}
