import type {
  AuthPayload,
  AuthUser,
  Company,
  ContactDetail,
  ContactListItem,
  Dashboard,
  Followup,
  SavedFilter,
  SearchResult,
  Tag
} from "@personal-crm/types";

type FetchMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: FetchMethod;
  workspaceId?: string;
};

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null;
  getWorkspaceId?: () => string | null;
  onUnauthorized?: () => void;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown,
  ) {
    super(message);
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = this.options.getToken?.();
    const workspaceId = options.workspaceId ?? this.options.getWorkspaceId?.();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 401) {
      this.options.onUnauthorized?.();
    }

    if (!response.ok) {
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
      throw new ApiError(`API request failed for ${path}`, response.status, data);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  signUp(payload: { email: string; password: string; fullName: string; workspaceName: string }) {
    return this.request<AuthPayload>("/auth/signup", { method: "POST", body: payload });
  }

  signIn(payload: { email: string; password: string }) {
    return this.request<AuthPayload>("/auth/signin", { method: "POST", body: payload });
  }

  forgotPassword(payload: { email: string }) {
    return this.request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: payload
    });
  }

  signOut(payload: { refreshToken: string }) {
    return this.request<{ ok: true }>("/auth/signout", { method: "POST", body: payload });
  }

  getMe() {
    return this.request<{ user: AuthUser }>("/users/me");
  }

  getDashboard() {
    return this.request<Dashboard>("/workspaces/dashboard");
  }

  listContacts(params?: { query?: string; tagId?: string; staleOnly?: boolean }) {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.tagId) search.set("tagId", params.tagId);
    if (params?.staleOnly) search.set("staleOnly", "true");
    return this.request<ContactListItem[]>(`/contacts?${search.toString()}`);
  }

  getContact(contactId: string) {
    return this.request<ContactDetail>(`/contacts/${contactId}`);
  }

  createContact(payload: Record<string, unknown>) {
    return this.request<ContactDetail>("/contacts", { method: "POST", body: payload });
  }

  updateContact(contactId: string, payload: Record<string, unknown>) {
    return this.request<ContactDetail>(`/contacts/${contactId}`, { method: "PATCH", body: payload });
  }

  deleteContact(contactId: string) {
    return this.request<{ ok: true }>(`/contacts/${contactId}`, { method: "DELETE" });
  }

  listCompanies() {
    return this.request<Company[]>("/companies");
  }

  listTags() {
    return this.request<Tag[]>("/tags");
  }

  createInteraction(payload: Record<string, unknown>) {
    return this.request<{ ok: true }>("/interactions", { method: "POST", body: payload });
  }

  createFollowup(payload: Record<string, unknown>) {
    return this.request<Followup>("/followups", { method: "POST", body: payload });
  }

  listFollowups(params?: { status?: string }) {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    return this.request<Followup[]>(`/followups?${search.toString()}`);
  }

  completeFollowup(followupId: string) {
    return this.request<Followup>(`/followups/${followupId}/complete`, { method: "POST" });
  }

  search(query: string) {
    return this.request<SearchResult[]>(`/search/global?query=${encodeURIComponent(query)}`);
  }

  listSavedFilters() {
    return this.request<SavedFilter[]>("/contacts/saved-filters");
  }

  createSavedFilter(payload: { name: string; query?: string; tagIds?: string[]; staleOnly?: boolean }) {
    return this.request<SavedFilter>("/contacts/saved-filters", { method: "POST", body: payload });
  }

  dedupeSuggestions() {
    return this.request<
      Array<{
        primaryContactId: string;
        duplicateContactId: string;
        reason: string;
        confidence: number;
      }>
    >("/contacts/dedupe-suggestions");
  }

  rebuildContactMemory(contactId: string) {
    return this.request<{ externalJobId: string; jobId: string }>(`/memory/contacts/${contactId}/rebuild`, {
      method: "POST"
    });
  }

  inviteMember(payload: { email: string; role: "ADMIN" | "MEMBER" }) {
    return this.request<{ inviteToken: string }>("/workspaces/invitations", {
      method: "POST",
      body: payload
    });
  }

  listWorkspaceMembers() {
    return this.request<
      Array<{ id: string; email: string; fullName: string; role: "OWNER" | "ADMIN" | "MEMBER" }>
    >("/workspaces/members");
  }

  enqueueDemoSeed() {
    return this.request<{ jobId: string }>("/agents/seed-demo", { method: "POST" });
  }

  async exportContactsCsv(): Promise<string> {
    const token = this.options.getToken?.();
    const workspaceId = this.options.getWorkspaceId?.();
    const response = await fetch(`${this.options.baseUrl}/contacts/export/csv`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {})
      }
    });

    if (!response.ok) {
      throw new ApiError("Unable to export contacts CSV", response.status, await response.text());
    }

    return response.text();
  }

  importContactsCsv(csv: string) {
    return this.request<{ imported: number }>("/contacts/import/csv", {
      method: "POST",
      body: { csv }
    });
  }
}
