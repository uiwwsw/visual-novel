import test from "node:test";
import assert from "node:assert/strict";

import { GET as getPlayerScenario } from "../apps/studio/src/pages/api/player/projects/[id]/scenario.js";
import { POST as postScenario } from "../apps/studio/src/pages/api/projects/[id]/scenario.js";
import { __resetRuntimeStore } from "../apps/studio/src/lib/runtime-store.js";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("player scenario route returns fallback scenario when Supabase env is missing", async () => {
  __resetRuntimeStore();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await getPlayerScenario({ params: { id: "demo-project" } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.project.id, "demo-project");
  assert.equal(body.scenario.entryNodeId, "n_start");
  assert.ok(Array.isArray(body.scenario.nodes));
});

test("player scenario route returns studio draft from runtime store when Supabase is missing", async () => {
  __resetRuntimeStore();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const scenario = {
    meta: { title: "Draft VN", schemaVersion: "1.0.0" },
    entryNodeId: "n_start",
    nodes: [
      { id: "n_start", type: "scene", next: "n_end", data: { text: "draft text" } },
      { id: "n_end", type: "ending", data: { title: "draft end" } }
    ]
  };

  const saveRequest = new Request("http://localhost/api/projects/p1/scenario", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({
      requestedVersion: 1,
      currentVersion: 1,
      content: scenario
    })
  });

  const saveResponse = await postScenario({ request: saveRequest, params: { id: "p1" } });
  assert.equal(saveResponse.status, 200);

  const response = await getPlayerScenario({ params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.version, 2);
  assert.equal(body.scenario.meta.title, "Draft VN");
  assert.equal(body.scenario.nodes[0].data.text, "draft text");
});

test("player scenario route returns latest scenario from Supabase", async () => {
  __resetRuntimeStore();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    const target = String(url);
    assert.equal(options.method, "GET");

    if (target.includes("/rest/v1/projects?")) {
      return jsonResponse([
        {
          id: "project-uuid",
          name: "Live VN",
          slug: "live-vn",
          status: "published"
        }
      ]);
    }

    if (target.includes("/rest/v1/scenarios?")) {
      return jsonResponse([
        {
          id: "scenario-id",
          project_id: "project-uuid",
          version_no: 12,
          updated_at: "2026-02-24T15:00:00Z",
          content_jsonb: {
            meta: { title: "Live VN", schemaVersion: "1.0.0" },
            entryNodeId: "n_start",
            nodes: [
              { id: "n_start", type: "scene", next: "n_end", data: { text: "hello" } },
              { id: "n_end", type: "ending", data: { title: "end" } }
            ]
          }
        }
      ]);
    }

    throw new Error(`Unexpected fetch target: ${target}`);
  };

  try {
    const response = await getPlayerScenario({ params: { id: "live-vn" } });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.project.slug, "live-vn");
    assert.equal(body.version, 12);
    assert.equal(body.scenario.meta.title, "Live VN");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("player scenario route returns 404 when project is missing", async () => {
  __resetRuntimeStore();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const target = String(url);
    if (target.includes("/rest/v1/projects?")) {
      return jsonResponse([]);
    }
    throw new Error(`Unexpected fetch target: ${target}`);
  };

  try {
    const response = await getPlayerScenario({ params: { id: "missing" } });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.code, "INVALID_REQUEST");
  } finally {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
