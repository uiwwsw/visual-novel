import { ApiError, ErrorCode } from "./errors.js";

export const Role = Object.freeze({
  VIEWER: "viewer",
  EDITOR: "editor",
  OWNER: "owner"
});

const rank = Object.freeze({
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.OWNER]: 3
});

export function requireRole(userRole, minimumRole) {
  if (!userRole || !minimumRole) {
    throw new ApiError(401, ErrorCode.AUTH_REQUIRED, "Authentication required.");
  }
  if ((rank[userRole] ?? 0) < (rank[minimumRole] ?? 99)) {
    throw new ApiError(403, ErrorCode.FORBIDDEN_ROLE, "Insufficient role for this action.", {
      requiredRole: minimumRole,
      userRole
    });
  }
}

export function requireOwner(userRole) {
  requireRole(userRole, Role.OWNER);
}

export function requirePlan(planTier, requiredTier) {
  if (!planTier || !requiredTier) {
    throw new ApiError(400, ErrorCode.BUILD_FAILED, "Plan validation parameters missing.");
  }

  if (requiredTier === "pro" && planTier !== "pro") {
    throw new ApiError(
      402,
      ErrorCode.PLAN_LIMIT_EXCEEDED,
      "This feature requires a Pro plan.",
      { requiredPlan: "pro", currentPlan: planTier }
    );
  }
}
