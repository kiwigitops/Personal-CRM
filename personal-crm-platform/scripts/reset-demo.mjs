const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";
const email = process.env.DEMO_EMAIL ?? "owner@personal-crm.local";
const password = process.env.DEMO_PASSWORD ?? "password123";

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

const session = await request("/auth/signin", {
  body: JSON.stringify({ email, password }),
  method: "POST"
});

const result = await request("/agents/seed-demo", {
  headers: {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Workspace-Id": session.user.currentWorkspaceId
  },
  method: "POST"
});

console.log(JSON.stringify({ apiBaseUrl, jobId: result.jobId }, null, 2));

