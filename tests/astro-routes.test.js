import test from "node:test";
import assert from "node:assert/strict";

import { POST as postProject } from "../apps/studio/src/pages/api/projects/index.js";
import { POST as postBuild } from "../apps/studio/src/pages/api/projects/[id]/build.js";
import { POST as postScenario } from "../apps/studio/src/pages/api/projects/[id]/scenario.js";
import { POST as postValidate } from "../apps/studio/src/pages/api/projects/[id]/validate/index.js";
import { POST as postRollback } from "../apps/studio/src/pages/api/projects/[id]/rollback.js";

test("Astro project endpoint creates project for editor", async () => {
  const request = new Request("http://localhost/api/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({ name: "My VN", slug: "my-vn" })
  });

  const response = await postProject({ request });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.project.slug, "my-vn");
});

test("Astro build endpoint returns 402 for free SEO", async () => {
  const request = new Request("http://localhost/api/projects/p1/build", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor",
      "x-plan-tier": "free"
    },
    body: JSON.stringify({ jobType: "seo" })
  });

  const response = await postBuild({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 402);
  assert.equal(body.code, "PLAN_LIMIT_EXCEEDED");
});

test("Astro build endpoint returns 400 for invalid jobType", async () => {
  const request = new Request("http://localhost/api/projects/p1/build", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor",
      "x-plan-tier": "pro"
    },
    body: JSON.stringify({ jobType: "invalid-job" })
  });

  const response = await postBuild({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("Astro scenario endpoint returns 409 on version mismatch", async () => {
  const request = new Request("http://localhost/api/projects/p1/scenario", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({ requestedVersion: 1, currentVersion: 3 })
  });

  const response = await postScenario({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.code, "VERSION_CONFLICT");
});

test("Astro scenario endpoint returns 400 when currentVersion is missing", async () => {
  const request = new Request("http://localhost/api/projects/p1/scenario", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({ requestedVersion: 1 })
  });

  const response = await postScenario({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("Astro validate endpoint returns 422 for invalid scenario", async () => {
  const request = new Request("http://localhost/api/projects/p1/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({
      scenario: {
        meta: { schemaVersion: "1.0.0", title: "invalid" },
        nodes: [{ id: "n1", type: "scene", next: "missing", data: { text: "x" } }]
      }
    })
  });

  const response = await postValidate({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.code, "SCENARIO_VALIDATION_FAILED");
  assert.ok(Array.isArray(body.details.errors));
});

test("Astro validate endpoint returns 200 for valid scenario", async () => {
  const request = new Request("http://localhost/api/projects/p1/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor"
    },
    body: JSON.stringify({
      scenario: {
        meta: { schemaVersion: "1.0.0", title: "valid" },
        entryNodeId: "n_start",
        nodes: [
          { id: "n_start", type: "scene", next: "n_end", data: { text: "x" } },
          { id: "n_end", type: "ending", data: { endingId: "end" } }
        ]
      }
    })
  });

  const response = await postValidate({ request, params: { id: "p1" } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test("Astro build endpoint returns 400 when project id is missing", async () => {
  const request = new Request("http://localhost/api/projects//build", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "editor",
      "x-plan-tier": "pro"
    },
    body: JSON.stringify({ jobType: "web" })
  });

  const response = await postBuild({ request, params: {} });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});

test("Astro rollback endpoint returns 400 when project id is missing", async () => {
  const request = new Request("http://localhost/api/projects//rollback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-role": "owner"
    },
    body: JSON.stringify({ deploymentId: "dep_1" })
  });

  const response = await postRollback({ request, params: {} });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_REQUEST");
});
