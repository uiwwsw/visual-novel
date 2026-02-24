import { executeAsync, requireRole, Role, ApiError, ErrorCode, saveScenario } from "../../../../lib/platform-api.js";
import { readActorContext, readJson } from "../../../../lib/request-context.js";
import {
  createScenarioRecord,
  getScenarioRecord,
  isSupabaseEnabled,
  updateScenarioVersion
} from "../../../../lib/supabase-repository.js";
import { upsertProject, upsertScenario } from "../../../../lib/runtime-store.js";

export const prerender = false;

export async function POST({ request, params }) {
  const body = await readJson(request);

  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }
    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    if (isSupabaseEnabled()) {
      let scenario = await getScenarioRecord(params.id);
      if (!scenario) {
        scenario = await createScenarioRecord({
          projectId: params.id,
          userId: actor.userId,
          content: body.content
        });
      }

      const requestedVersion = body.requestedVersion ?? scenario.version_no;
      if (requestedVersion !== scenario.version_no) {
        throw new ApiError(409, ErrorCode.VERSION_CONFLICT, "Scenario version conflict.", {
          requestedVersion,
          currentVersion: scenario.version_no
        });
      }

      const nextVersion = scenario.version_no + 1;
      const updated = await updateScenarioVersion({
        scenarioId: scenario.id,
        expectedVersion: scenario.version_no,
        nextVersion,
        userId: actor.userId,
        content: body.content
      });
      if (!updated) {
        throw new ApiError(409, ErrorCode.VERSION_CONFLICT, "Scenario version conflict.", {
          requestedVersion,
          currentVersion: scenario.version_no
        });
      }

      return {
        status: 200,
        body: {
          ok: true,
          nextVersion
        }
      };
    }

    const saved = saveScenario({
      userRole: actor.userRole,
      projectId: params.id,
      requestedVersion: body.requestedVersion,
      currentVersion: body.currentVersion
    });
    upsertProject({ id: params.id, slug: params.id, name: `Project ${params.id}` });
    if (body.content && typeof body.content === "object") {
      upsertScenario({
        projectId: params.id,
        scenario: body.content,
        version: saved.body.nextVersion
      });
    }
    return saved;
  }, {});

  return Response.json(result.body, { status: result.status });
}
