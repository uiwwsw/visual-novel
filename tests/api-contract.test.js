import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { execute } from "../packages/api-core/http.js";
import { createProject, requestBuild, rollbackDeployment, saveScenario } from "../packages/api-core/routes.js";

test("free plan SEO request returns 402 PLAN_LIMIT_EXCEEDED", () => {
  const response = execute(requestBuild, {
    userRole: "editor",
    planTier: "free",
    jobType: "seo"
  });

  assert.equal(response.status, 402);
  assert.equal(response.body.code, "PLAN_LIMIT_EXCEEDED");
  assert.match(response.body.message, /Pro plan/i);
  assert.ok(response.body.correlationId);
});

test("viewer build request returns 403 FORBIDDEN_ROLE", () => {
  const response = execute(requestBuild, {
    userRole: "viewer",
    planTier: "pro",
    jobType: "web"
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "FORBIDDEN_ROLE");
  assert.equal(response.body.details.requiredRole, "editor");
});

test("scenario version mismatch returns 409 VERSION_CONFLICT", () => {
  const response = execute(saveScenario, {
    userRole: "editor",
    requestedVersion: 3,
    currentVersion: 5
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "VERSION_CONFLICT");
  assert.equal(response.body.details.requestedVersion, 3);
  assert.equal(response.body.details.currentVersion, 5);
});

test("scenario save requires integer versions", () => {
  const response = execute(saveScenario, {
    userRole: "editor",
    requestedVersion: 1
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
});

test("owner rollback request succeeds with 202", () => {
  const response = execute(rollbackDeployment, {
    userRole: "owner",
    deploymentId: "dep_123"
  });

  assert.equal(response.status, 202);
  assert.equal(response.body.action, "rollback_queued");
});

test("rollback without deploymentId returns 400 INVALID_REQUEST", () => {
  const response = execute(rollbackDeployment, {
    userRole: "owner"
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
});

test("invalid createProject payload returns 400 INVALID_REQUEST", () => {
  const response = execute(createProject, {
    userRole: "editor",
    name: "Only Name"
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_REQUEST");
});

test("failure fixtures are loadable for Sprint 2 validator cases", () => {
  const fixturePaths = [
    "tests/fixtures/invalid_dangling_edge.json",
    "tests/fixtures/invalid_condition_type.json",
    "tests/fixtures/invalid_no_entry.json",
    "tests/fixtures/invalid_unreachable_ending.json",
    "tests/fixtures/invalid_choice_overflow.json",
    "tests/fixtures/invalid_in_operator.json"
  ];

  for (const fixturePath of fixturePaths) {
    const content = fs.readFileSync(fixturePath, "utf8");
    const parsed = JSON.parse(content);
    assert.ok(parsed.meta);
    assert.ok(Array.isArray(parsed.nodes));
  }
});
