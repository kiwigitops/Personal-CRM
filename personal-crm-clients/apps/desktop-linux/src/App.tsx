import { ApiClient } from "@personal-crm/api-client";
import type { AuthUser } from "@personal-crm/types";
import { Avatar, Badge, Button, Card, CardDescription, CardTitle, Input } from "@personal-crm/ui";
import { getInitials } from "@personal-crm/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { clearSecret, getSecret, notify, storeSecret } from "./desktopBridge";

type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const defaultApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

export function App() {
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<"dashboard" | "contacts" | "settings">("dashboard");
  const api = new ApiClient({
    baseUrl: apiUrl,
    getToken: () => session?.accessToken ?? null,
    getWorkspaceId: () => session?.user.currentWorkspaceId ?? null,
    onUnauthorized: () => setSession(null)
  });

  useEffect(() => {
    void Promise.all([getSecret("session"), getSecret("apiUrl")]).then(([storedSession, storedApiUrl]) => {
      if (storedApiUrl) setApiUrl(storedApiUrl);
      if (storedSession) setSession(JSON.parse(storedSession) as Session);
    });
  }, []);

  const saveSession = async (next: Session) => {
    setSession(next);
    await storeSecret("session", JSON.stringify(next));
    await notify("Personal CRM", "Signed in and reminders are ready.");
  };

  const signOut = async () => {
    if (session?.refreshToken) {
      await api.signOut({ refreshToken: session.refreshToken }).catch(() => undefined);
    }
    await clearSecret("session");
    setSession(null);
  };

  if (!session) {
    return <SignIn api={api} apiUrl={apiUrl} onApiUrl={setApiUrl} onSession={saveSession} />;
  }

  return (
    <div className="desktop-shell">
      <aside>
        <h1>Personal CRM</h1>
        <p>Linux desktop workspace</p>
        {(["dashboard", "contacts", "settings"] as const).map((item) => (
          <button className={screen === item ? "active" : ""} key={item} onClick={() => setScreen(item)}>
            {item}
          </button>
        ))}
        <button onClick={() => void signOut()}>Sign out</button>
      </aside>
      <main>
        {screen === "dashboard" ? <Dashboard api={api} /> : null}
        {screen === "contacts" ? <Contacts api={api} /> : null}
        {screen === "settings" ? (
          <Settings apiUrl={apiUrl} onSave={(value) => void storeSecret("apiUrl", value).then(() => setApiUrl(value))} />
        ) : null}
      </main>
    </div>
  );
}

function SignIn({
  api,
  apiUrl,
  onApiUrl,
  onSession
}: {
  api: ApiClient;
  apiUrl: string;
  onApiUrl: (value: string) => void;
  onSession: (session: Session) => Promise<void>;
}) {
  const [email, setEmail] = useState("owner@personal-crm.local");
  const [password, setPassword] = useState("password123");

  return (
    <div className="desktop-auth">
      <Card className="auth-card">
        <CardTitle>Sign in to Personal CRM</CardTitle>
        <CardDescription>Desktop tokens are stored through the Linux keyring when running in Tauri.</CardDescription>
        <Input onChange={(event) => onApiUrl(event.target.value)} value={apiUrl} />
        <Input onChange={(event) => setEmail(event.target.value)} value={email} />
        <Input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
        <Button onClick={() => void api.signIn({ email, password }).then(onSession)} type="button">
          Sign in
        </Button>
      </Card>
    </div>
  );
}

function Dashboard({ api }: { api: ApiClient }) {
  const dashboard = useQuery({ queryFn: () => api.getDashboard(), queryKey: ["desktop-dashboard"] });

  return (
    <section className="space">
      <h2>Dashboard</h2>
      <div className="metrics">
        {[
          ["Contacts", dashboard.data?.metrics.totalContacts ?? 0],
          ["Warm", dashboard.data?.metrics.warmContacts ?? 0],
          ["Overdue", dashboard.data?.metrics.overdueCount ?? 0]
        ].map(([label, value]) => (
          <Card key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle>Suggested actions</CardTitle>
        {dashboard.data?.suggestedActions.map((action) => (
          <p key={action.id}>{action.title}</p>
        ))}
      </Card>
    </section>
  );
}

function Contacts({ api }: { api: ApiClient }) {
  const contacts = useQuery({ queryFn: () => api.listContacts(), queryKey: ["desktop-contacts"] });

  return (
    <section className="space">
      <h2>Contacts</h2>
      {contacts.data?.map((contact) => (
        <Card className="contact-row" key={contact.id}>
          <Avatar imageUrl={contact.avatarUrl}>{getInitials(contact.firstName, contact.lastName)}</Avatar>
          <div>
            <strong>{contact.firstName} {contact.lastName}</strong>
            <p>{contact.companyName ?? contact.email ?? "No company"}</p>
          </div>
          <Badge>{contact.warmthScore}</Badge>
        </Card>
      ))}
    </section>
  );
}

function Settings({ apiUrl, onSave }: { apiUrl: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(apiUrl);

  return (
    <Card className="settings-card">
      <CardTitle>Desktop settings</CardTitle>
      <CardDescription>Configure local API URL, deep-link target, and notification behavior.</CardDescription>
      <Input onChange={(event) => setValue(event.target.value)} value={value} />
      <Button onClick={() => onSave(value)} type="button">Save settings</Button>
    </Card>
  );
}

