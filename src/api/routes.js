import { ApiError, ErrorCode } from "./errors.js";
import { requireOwner, requirePlan, requireRole, Role } from "./permissions.js";

function createCorrelationId() {
  return `corr_${Math.random().toString(36).slice(2, 12)}`;
}

export function saveScenario({ userRole, requestedVersion, currentVersion }) {
  requireRole(userRole, Role.EDITOR);
  if (requestedVersion !== currentVersion) {
    throw new ApiError(
      409,
      ErrorCode.VERSION_CONFLICT,
      "Scenario version conflict.",
      { requestedVersion, currentVersion }
    );
  }

  return {
    status: 200,
    body: {
      ok: true,
      nextVersion: currentVersion + 1,
      correlationId: createCorrelationId()
    }
  };
}

export function createProject({ userRole, name, slug }) {
  requireRole(userRole, Role.EDITOR);
  if (!name || !slug) {
    throw new ApiError(400, ErrorCode.BUILD_FAILED, "Project name and slug are required.");
  }

  return {
    status: 201,
    body: {
      ok: true,
      project: {
        id: `proj_${Math.random().toString(36).slice(2, 10)}`,
        name,
        slug
      },
      correlationId: createCorrelationId()
    }
  };
}

export function requestBuild({ userRole, planTier, jobType }) {
  requireRole(userRole, Role.EDITOR);
  if (jobType === "seo") {
    requirePlan(planTier, "pro");
  }

  return {
    status: 202,
    body: {
      ok: true,
      state: "queued",
      jobType,
      correlationId: createCorrelationId()
    }
  };
}

export function rollbackDeployment({ userRole, deploymentId }) {
  requireOwner(userRole);
  if (!deploymentId) {
    throw new ApiError(400, ErrorCode.DEPLOY_FAILED, "Deployment ID is required.");
  }

  return {
    status: 202,
    body: {
      ok: true,
      action: "rollback_queued",
      deploymentId,
      correlationId: createCorrelationId()
    }
  };
}
