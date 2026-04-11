"use client";

import {
  Bell,
  CalendarClock,
  Command,
  ContactRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun
} from "@personal-crm/ui";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "./auth-provider";
import { GlobalCommandPalette } from "./global-command-palette";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/contacts", icon: ContactRound, label: "Contacts" },
  { href: "/followups", icon: CalendarClock, label: "Follow-ups" },
  { href: "/workspace", icon: Settings, label: "Workspace" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "/" && event.target === document.body) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <GlobalCommandPalette onOpenChange={setCommandOpen} open={commandOpen} />
      <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-72 flex-col rounded-[2rem] border border-border/70 bg-card/90 p-4 shadow-soft backdrop-blur-xl lg:flex">
        <Link className="flex items-center gap-3 rounded-2xl px-3 py-3" href="/dashboard">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ContactRound size={22} />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold">Personal CRM</span>
            <span className="text-xs text-muted-foreground">Relationship intelligence</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground"
          onClick={() => setCommandOpen(true)}
          type="button"
        >
          <Command size={16} />
          <span className="flex-1">Search or command</span>
          <kbd className="rounded-lg bg-muted px-2 py-1 text-[10px]">Ctrl K</kbd>
        </button>
        <div className="mt-auto space-y-3 rounded-2xl bg-muted/70 p-4">
          <p className="text-sm font-semibold">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <div className="flex gap-2">
            <button
              aria-label="Toggle theme"
              className="flex h-10 flex-1 items-center justify-center rounded-xl bg-background text-muted-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              type="button"
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              aria-label="Notifications"
              className="flex h-10 flex-1 items-center justify-center rounded-xl bg-background text-muted-foreground"
              onClick={() => router.push("/dashboard")}
              type="button"
            >
              <Bell size={16} />
            </button>
            <button
              aria-label="Sign out"
              className="flex h-10 flex-1 items-center justify-center rounded-xl bg-background text-muted-foreground"
              onClick={() => void signOut().then(() => router.replace("/auth/sign-in"))}
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-7xl px-4 py-4 lg:ml-80 lg:px-6 lg:py-6">
        {children}
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.5rem] border border-border bg-card/95 p-2 shadow-soft backdrop-blur lg:hidden">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              aria-label={item.label}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
