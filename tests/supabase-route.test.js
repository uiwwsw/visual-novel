import test from "node:test";
import assert from "node:assert/strict";

import { POST as postProject } from "../apps/studio/src/pages/api/projects/index.js";
import { POST as postScenario } from "../apps/studio/src/pages/api/projects/[id]/scenario.js";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("project route uses Supabase repository when env is set", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/rest\/v1\/projects/);
    assert.equal(options.method, "POST");
    return jsonResponse([
      {
        id: "project-id",
        slug: "from-db",
        name: "DB Project"
      }
    ]);
  };

  try {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-user-id": "00000000-0000-0000-0000-000000000010",
        "x-org-id": "00000000-0000-0000-0000-000000000020"
      },
      body: JSON.stringify({ name: "My VN", slug: "my-vn" })
    });

    const response = await postProject({ request });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.project.slug, "from-db");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("project route returns 400 for invalid payload in Supabase mode", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("fetch should not be called for invalid payload");
  };

  try {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-user-id": "00000000-0000-0000-0000-000000000010",
        "x-org-id": "00000000-0000-0000-0000-000000000020"
      },
      body: JSON.stringify({ name: "My VN" })
    });

    const response = await postProject({ request });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.code, "INVALID_REQUEST");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("project route returns 500 when Supabase create returns empty rows", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/rest\/v1\/projects/);
    assert.equal(options.method, "POST");
    return jsonResponse([]);
  };

  try {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-user-id": "00000000-0000-0000-0000-000000000010",
        "x-org-id": "00000000-0000-0000-0000-000000000020"
      },
      body: JSON.stringify({ name: "My VN", slug: "my-vn" })
    });

    const response = await postProject({ request });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.code, "INTEGRATION_FAILED");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("scenario route uses Supabase version and returns 409 on mismatch", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    const target = String(url);

    if (target.includes("/rest/v1/scenarios?project_id=eq.p1")) {
      assert.equal(options.method, "GET");
      return jsonResponse([
        {
          id: "scenario-id",
          project_id: "p1",
          version_no: 5
        }
      ]);
    }

    throw new Error(`Unexpected fetch target: ${target}`);
  };

  try {
    const request = new Request("http://localhost/api/projects/p1/scenario", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-user-id": "00000000-0000-0000-0000-000000000010"
      },
      body: JSON.stringify({ requestedVersion: 1, content: {} })
    });

    const response = await postScenario({ request, params: { id: "p1" } });
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.code, "VERSION_CONFLICT");
    assert.equal(body.details.currentVersion, 5);
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("scenario route returns 409 when conditional update affects zero rows", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    const target = String(url);

    if (target.includes("/rest/v1/scenarios?project_id=eq.p1")) {
      assert.equal(options.method, "GET");
      return jsonResponse([
        {
          id: "scenario-id",
          project_id: "p1",
          version_no: 5
        }
      ]);
    }

    if (target.includes("/rest/v1/scenarios?id=eq.scenario-id&version_no=eq.5")) {
      assert.equal(options.method, "PATCH");
      return jsonResponse([]);
    }

    throw new Error(`Unexpected fetch target: ${target}`);
  };

  try {
    const request = new Request("http://localhost/api/projects/p1/scenario", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-user-id": "00000000-0000-0000-0000-000000000010"
      },
      body: JSON.stringify({ requestedVersion: 5, content: { foo: "bar" } })
    });

    const response = await postScenario({ request, params: { id: "p1" } });
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.code, "VERSION_CONFLICT");
    assert.equal(body.details.currentVersion, 5);
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("project route derives actor role from bearer token and membership", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    const target = String(url);

    if (target.includes("/auth/v1/user")) {
      assert.match(options.headers.Authorization, /Bearer token-123/);
      return jsonResponse({ id: "00000000-0000-0000-0000-000000000099" });
    }

    if (target.includes("/rest/v1/memberships?")) {
      return jsonResponse([{ role: "editor" }]);
    }

    if (target.includes("/rest/v1/organizations?")) {
      return jsonResponse([{ plan_tier: "pro" }]);
    }

    if (target.includes("/rest/v1/projects")) {
      return jsonResponse([{ id: "project-id", slug: "from-db", name: "DB Project" }]);
    }

    throw new Error(`Unexpected fetch target: ${target}`);
  };

  try {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-123",
        "x-user-role": "viewer",
        "x-org-id": "00000000-0000-0000-0000-000000000020"
      },
      body: JSON.stringify({ name: "My VN", slug: "my-vn" })
    });

    const response = await postProject({ request });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.project.id, "project-id");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("strict actor auth rejects requests without bearer token", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.STRICT_ACTOR_AUTH = "true";

  try {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "editor",
        "x-org-id": "00000000-0000-0000-0000-000000000020"
      },
      body: JSON.stringify({ name: "My VN", slug: "my-vn" })
    });

    const response = await postProject({ request });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.code, "AUTH_REQUIRED");
  } finally {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.STRICT_ACTOR_AUTH;
  }
});
