import { ApiClient } from "@personal-crm/api-client";
import type { AuthUser } from "@personal-crm/types";
import { mobileTheme } from "@personal-crm/ui";
import { getInitials } from "@personal-crm/utils";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

const queryClient = new QueryClient();
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/v1";

type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function createClient(session: Session | null, onUnauthorized: () => void) {
  return new ApiClient({
    baseUrl: apiUrl,
    getToken: () => session?.accessToken ?? null,
    getWorkspaceId: () => session?.user.currentWorkspaceId ?? null,
    onUnauthorized
  });
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileRoot />
    </QueryClientProvider>
  );
}

function MobileRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "contacts" | "followups" | "profile">("dashboard");
  const api = createClient(session, () => setSession(null));

  useEffect(() => {
    void SecureStore.getItemAsync("personal-crm.session").then((value) => {
      if (value) {
        setSession(JSON.parse(value) as Session);
      }
      setBooting(false);
    });
  }, []);

  const saveSession = async (next: Session) => {
    setSession(next);
    await SecureStore.setItemAsync("personal-crm.session", JSON.stringify(next));
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("personal-crm.session");
    setSession(null);
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <SignInScreen api={api} onSession={saveSession} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Personal CRM</Text>
        <Text style={styles.title}>{tab === "dashboard" ? "Today" : tab}</Text>
      </View>
      <View style={styles.content}>
        {tab === "dashboard" ? <DashboardScreen api={api} /> : null}
        {tab === "contacts" ? <ContactsScreen api={api} /> : null}
        {tab === "followups" ? <FollowupsScreen api={api} /> : null}
        {tab === "profile" ? <ProfileScreen onSignOut={signOut} user={session.user} /> : null}
      </View>
      <View style={styles.tabs}>
        {(["dashboard", "contacts", "followups", "profile"] as const).map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function SignInScreen({ api, onSession }: { api: ApiClient; onSession: (session: Session) => Promise<void> }) {
  const [email, setEmail] = useState("owner@personal-crm.local");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const result = await api.signIn({ email, password });
    await onSession(result);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.signInCard}>
        <Text style={styles.eyebrow}>Relationship intelligence</Text>
        <Text style={styles.hero}>Sign in to your CRM</Text>
        <TextInput autoCapitalize="none" onChangeText={setEmail} placeholder="Email" style={styles.input} value={email} />
        <TextInput onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} value={password} />
        <Pressable onPress={submit} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DashboardScreen({ api }: { api: ApiClient }) {
  const dashboard = useQuery({ queryFn: () => api.getDashboard(), queryKey: ["mobile-dashboard"] });

  if (dashboard.isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <ScrollView contentContainerStyle={styles.stack}>
      {[
        ["Contacts", dashboard.data?.metrics.totalContacts ?? 0],
        ["Warm", dashboard.data?.metrics.warmContacts ?? 0],
        ["Overdue", dashboard.data?.metrics.overdueCount ?? 0],
        ["Interactions", dashboard.data?.metrics.interactionsThisMonth ?? 0]
      ].map(([label, value]) => (
        <View key={label} style={styles.metricCard}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.muted}>{label}</Text>
        </View>
      ))}
      <SectionTitle title="Suggested actions" />
      {dashboard.data?.suggestedActions.map((action) => (
        <View key={action.id} style={styles.card}>
          <Text style={styles.cardTitle}>{action.title}</Text>
          <Text style={styles.muted}>{action.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ContactsScreen({ api }: { api: ApiClient }) {
  const contacts = useQuery({ queryFn: () => api.listContacts(), queryKey: ["mobile-contacts"] });

  return (
    <FlatList
      contentContainerStyle={styles.stack}
      data={contacts.data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.contactCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.muted}>{item.companyName ?? item.email ?? "No company"}</Text>
          </View>
          <Text style={styles.badge}>{item.warmthScore}</Text>
        </View>
      )}
    />
  );
}

function FollowupsScreen({ api }: { api: ApiClient }) {
  const followups = useQuery({ queryFn: () => api.listFollowups({ status: "PENDING" }), queryKey: ["mobile-followups"] });

  return (
    <FlatList
      contentContainerStyle={styles.stack}
      data={followups.data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.contactName}</Text>
          <Text style={styles.muted}>{item.prompt}</Text>
          <Text style={styles.badge}>{item.channel}</Text>
        </View>
      )}
    />
  );
}

function ProfileScreen({ onSignOut, user }: { onSignOut: () => Promise<void>; user: AuthUser }) {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email}</Text>
      </View>
      <Pressable onPress={onSignOut} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: mobileTheme.colors.accent,
    borderRadius: mobileTheme.radius.lg,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  avatarText: {
    color: mobileTheme.colors.primary,
    fontWeight: "800"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: mobileTheme.colors.accent,
    borderRadius: 999,
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    gap: 8,
    padding: mobileTheme.spacing.md
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  contactCard: {
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: mobileTheme.spacing.md
  },
  content: {
    flex: 1,
    paddingHorizontal: mobileTheme.spacing.md
  },
  eyebrow: {
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  header: {
    padding: mobileTheme.spacing.md
  },
  hero: {
    color: mobileTheme.colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  input: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    color: mobileTheme.colors.text,
    padding: mobileTheme.spacing.md
  },
  metricCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radius.xl,
    padding: mobileTheme.spacing.lg
  },
  metricValue: {
    color: mobileTheme.colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  muted: {
    color: mobileTheme.colors.textMuted
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radius.lg,
    padding: mobileTheme.spacing.md
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  root: {
    backgroundColor: mobileTheme.colors.background,
    flex: 1
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    padding: mobileTheme.spacing.md
  },
  secondaryButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "900"
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8
  },
  signInCard: {
    gap: 16,
    padding: mobileTheme.spacing.lg
  },
  stack: {
    gap: 12,
    paddingBottom: 24
  },
  tab: {
    alignItems: "center",
    borderRadius: mobileTheme.radius.lg,
    flex: 1,
    padding: 10
  },
  tabActive: {
    backgroundColor: mobileTheme.colors.primary
  },
  tabText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  tabTextActive: {
    color: "#fff"
  },
  tabs: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: mobileTheme.spacing.sm
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 32,
    fontWeight: "900",
    textTransform: "capitalize"
  }
});
