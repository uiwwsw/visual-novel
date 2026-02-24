import test from "node:test";
import assert from "node:assert/strict";

import { execute } from "../packages/api-core/http.js";
import { requestBuild, rollbackDeployment, saveScenario } from "../packages/api-core/routes.js";

test("viewer can not save scenario", () => {
  const response = execute(saveScenario, {
    userRole: "viewer",
    requestedVersion: 1,
    currentVersion: 1
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "FORBIDDEN_ROLE");
});

test("editor can save scenario when version matches", () => {
  const response = execute(saveScenario, {
    userRole: "editor",
    requestedVersion: 7,
    currentVersion: 7
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.nextVersion, 8);
});

test("editor can request preview/web build", () => {
  const response = execute(requestBuild, {
    userRole: "editor",
    planTier: "free",
    jobType: "web"
  });

  assert.equal(response.status, 202);
});

test("editor cannot rollback deployment", () => {
  const response = execute(rollbackDeployment, {
    userRole: "editor",
    deploymentId: "dep_456"
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "FORBIDDEN_ROLE");
  assert.equal(response.body.details.requiredRole, "owner");
});
