import { ApiError, ErrorCode, executeAsync, requireRole, Role } from "../../../../../lib/platform-api.js";
import { readActorContext, readJson } from "../../../../../lib/request-context.js";
import { validateScenario } from "../../../../../../../../packages/vn-schema/index.js";

export const prerender = false;

export async function POST({ request, params }) {
  const body = await readJson(request);

  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }
    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    const issues = validateScenario(body.scenario ?? {});
    const errors = issues.filter((i) => i.severity === "error");

    if (errors.length > 0) {
      throw new ApiError(
        422,
        ErrorCode.SCENARIO_VALIDATION_FAILED,
        "Scenario validation failed.",
        {
          projectId: params.id,
          issueCount: issues.length,
          errors
        }
      );
    }

    return {
      status: 200,
      body: {
        ok: true,
        projectId: params.id,
        issueCount: issues.length,
        issues
      }
    };
  }, {});

  return Response.json(result.body, { status: result.status });
}
